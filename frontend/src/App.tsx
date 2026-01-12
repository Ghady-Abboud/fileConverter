import { useState } from 'react'
import './App.css'

function App() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not defined in environment variables')
  }
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileFormats, setFileFormats] = useState<Record<number, string>>({})
  const [availableFormats, setAvailableFormats] = useState<Record<number, string[]>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [convertedFiles, setConvertedFiles] = useState<Record<number, { blob: Blob; filename: string }>>({})
  const [isConverting, setIsConverting] = useState<Record<number, boolean>>({})

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  const fetchAvailableFormats = async (extension: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/formats/${extension}`)
      const data = await response.json()
      return data.formats || []
    } catch (error) {
      console.error('Error fetching formats:', error)
      return []
    }
  }

  const processFiles = async (files: File[]) => {
    setSelectedFiles(files)

    const formatsMap: Record<number, string[]> = {}

    for (let i = 0; i < files.length; i++) {
      const ext = getFileExtension(files[i].name)
      const formats = await fetchAvailableFormats(ext)
      formatsMap[i] = formats
    }

    setAvailableFormats(formatsMap)
    setFileFormats({})
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleConvert = async () => {
    const filesToConvert = selectedFiles
      .map((file, index) => ({
        file,
        index,
        outputFormat: fileFormats[index]
      }))
      .filter(item => item.outputFormat)

    if (filesToConvert.length === 0) return

    const documentFormats = ['pdf', 'doc', 'docx', 'odt']
    const imageFormats = ['jpeg', 'png', 'bmp', 'gif', 'tiff']

    for (const item of filesToConvert) {
      const fileIndex = item.index
      setIsConverting(prev => ({
        ...prev,
        [fileIndex] : true,
      }))

      const isDocumentConversion = documentFormats.includes(item.outputFormat)
      const isImageConversion = imageFormats.includes(item.outputFormat)
      const endpoint = isDocumentConversion
        ? `${API_BASE_URL}/convert_word_file`
        : isImageConversion
        ? `${API_BASE_URL}/convert_image_file`
        : null

      if (!endpoint) {
        console.error(`Unsupported output format: ${item.outputFormat}`)
        setIsConverting(prev => ({
          ...prev,
          [fileIndex]: false
        }))
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('output_format', item.outputFormat)
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData
        })
        if (response.ok) {
          const blob = await response.blob()
          const filename = item.file.name.replace(/\.[^/.]+$/, '') + '.' + item.outputFormat
          setConvertedFiles(prev => ({
            ...prev,
            [fileIndex]: { blob, filename }
          }))
          setIsConverting(prev => ({
            ...prev,
            [fileIndex]: false
          }))
          console.log(`Successfully converted ${item.file.name} to ${item.outputFormat}`)
        }
      } catch (error) {
        console.error(`Failed to convert ${item.file.name}`, error)
      } finally {
        setIsConverting(prev => ({
          ...prev,
          [fileIndex]: false
        }))
      }
    }
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)

    const newFormats = { ...fileFormats }
    delete newFormats[index]
    setFileFormats(newFormats)

    const newAvailableFormats = { ...availableFormats }
    delete newAvailableFormats[index]
    setAvailableFormats(newAvailableFormats)

    const newConvertedFiles = { ...convertedFiles }
    delete newConvertedFiles[index]
    setConvertedFiles(newConvertedFiles)
  }

  const updateFileFormat = (index: number, format: string) => {
    setFileFormats({
      ...fileFormats,
      [index]: format
    })
  }

  const handleDownload = (index: number) => {
    const convertedFile = convertedFiles[index]
    if (!convertedFile) return

    const blobURL = URL.createObjectURL(convertedFile.blob)
    const link = document.createElement('a')

    link.href = blobURL
    link.download = convertedFile.filename

    document.body.appendChild(link)

    link.dispatchEvent(
    new MouseEvent('click', { 
      bubbles: true, 
      cancelable: true, 
      view: window 
    }))
    document.body.removeChild(link)
  }

  const hasSelectedFormats = Object.keys(fileFormats).some(key => fileFormats[parseInt(key)])

  return (
    <div className="container">
      <header>
        <h1>File Converter</h1>
        <p>Simple, fast, no ads. Convert your files instantly.</p>
      </header>

      <main>
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''} ${selectedFiles.length > 0 ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedFiles.length === 0 ? (
            <>
              <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="upload-text">Drag and drop your files here</p>
              <p className="upload-subtext">or</p>
              <label htmlFor="file-input" className="browse-button">
                Browse Files
              </label>
              <input
                id="file-input"
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </>
          ) : (
            <div className="files-list">
              {selectedFiles.map((file, index) => (
                <div key={index} className="file-info">
                  <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="file-details">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    {availableFormats[index] && availableFormats[index].length > 0 && !isConverting[index] && !convertedFiles[index] && (
                      <div className="format-selection">
                        <span className="format-label">Convert to:</span>
                        <div className="format-options">
                          {availableFormats[index].map(format => (
                            <button
                              key={format}
                              className={`format-chip ${fileFormats[index] === format ? 'selected' : ''}`}
                              onClick={() => updateFileFormat(index, format)}
                            >
                              {format.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {availableFormats[index] && availableFormats[index].length === 0 && (
                      <p className="unsupported-format">Unsupported file type</p>
                    )}
                    {isConverting[index] && (
                      <div className="converting-status">
                        <span className="spinner"></span>
                        <span>Converting...</span>
                      </div>
                    )}
                    {convertedFiles[index] && !isConverting[index] && (
                      <button className="download-button" onClick={() => handleDownload(index)}>
                        <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download {convertedFiles[index].filename}
                      </button>
                    )}
                  </div>
                  <button
                    className="remove-button"
                    onClick={() => removeFile(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasSelectedFormats && (
          <button className="convert-button" onClick={handleConvert}>
            Convert {Object.keys(fileFormats).filter(key => fileFormats[parseInt(key)]).length} {Object.keys(fileFormats).filter(key => fileFormats[parseInt(key)]).length === 1 ? 'File' : 'Files'}
          </button>
        )}
      </main>
    </div>
  )
}

export default App
