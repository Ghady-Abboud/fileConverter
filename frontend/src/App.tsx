import { useState } from 'react'
import './App.css'

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileFormats, setFileFormats] = useState<Record<number, string>>({})
  const [availableFormats, setAvailableFormats] = useState<Record<number, string[]>>({})
  const [isDragging, setIsDragging] = useState(false)

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  const fetchAvailableFormats = async (extension: string): Promise<string[]> => {
    try {
      const response = await fetch(`http://localhost:8000/formats/${extension}`)
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
        outputFormat: fileFormats[index]
      }))
      .filter(item => item.outputFormat)

    if (filesToConvert.length === 0) return

    // TODO: Add conversion logic here
    console.log('Converting files:', filesToConvert.map(item => ({
      name: item.file.name,
      to: item.outputFormat
    })))
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
  }

  const updateFileFormat = (index: number, format: string) => {
    setFileFormats({
      ...fileFormats,
      [index]: format
    })
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
                    {availableFormats[index] && availableFormats[index].length > 0 && (
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
