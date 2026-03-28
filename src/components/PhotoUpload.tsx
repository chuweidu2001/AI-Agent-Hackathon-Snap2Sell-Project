import React, { useState, useCallback } from 'react'

interface PhotoUploadProps {
  onUpload: (file: File) => void
  disabled?: boolean
}

export function PhotoUpload({ onUpload, disabled }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setPreview(URL.createObjectURL(file))
    onUpload(file)
  }, [onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div
      className={`upload-zone ${dragOver ? 'drag-over' : ''} ${preview ? 'has-preview' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && document.getElementById('file-input')?.click()}
    >
      {preview ? (
        <img src={preview} alt="Preview" className="upload-preview" />
      ) : (
        <div className="upload-placeholder">
          <div className="upload-icon">📷</div>
          <p>Drop a photo here or click to upload</p>
          <p className="upload-hint">One photo = one item to sell</p>
        </div>
      )}
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
    </div>
  )
}
