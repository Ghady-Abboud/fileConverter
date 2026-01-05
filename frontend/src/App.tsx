import { useState } from 'react'
import './App.css'

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [outputFormat, setOutputFormat] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files))
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
      setSelectedFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleConvert = async () => {
    if (selectedFiles.length === 0 || !outputFormat) return
    // TODO: Add conversion logic here
    console.log('Converting files:', selectedFiles.map(f => f.name), 'to', outputFormat)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  const getAvailableFormats = () => {
    if (selectedFiles.length === 0) return []
    const ext = getFileExtension(selectedFiles[0].name)

    // Document formats
    if (['doc', 'docx', 'odt'].includes(ext)) {
      return ['pdf']
    }
    if (ext === 'pdf') {
      return ['docx']
    }
    // Image formats
    if (['jpeg', 'jpg', 'png', 'bmp', 'gif', 'tiff'].includes(ext)) {
      return ['jpeg', 'png', 'bmp', 'gif', 'tiff'].filter(f => f !== ext)
    }
    return []
  }

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
              <p className="supported-formats">
                Supported: PDF, DOC, DOCX, ODT, JPG, PNG, BMP, GIF, TIFF
              </p>
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

        {selectedFiles.length > 0 && getAvailableFormats().length > 0 && (
          <div className="format-selector">
            <label htmlFor="format">Convert to:</label>
            <select
              id="format"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
            >
              <option value="">Select format...</option>
              {getAvailableFormats().map(format => (
                <option key={format} value={format}>{format.toUpperCase()}</option>
              ))}
            </select>
          </div>
        )}

        {selectedFiles.length > 0 && outputFormat && (
          <button className="convert-button" onClick={handleConvert}>
            Convert {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
          </button>
        )}
      </main>
    </div>
  )
}

export default App
