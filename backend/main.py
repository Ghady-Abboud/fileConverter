from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pdf2docx import Converter
from fastapi.responses import FileResponse
from PIL import Image
import subprocess
import os
import magic
import tempfile
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

allowed_origins = os.getenv("ALLOWED_ORIGINS").split(",")

app.add_middleware(
  CORSMiddleware,
  allow_origins=allowed_origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

supportedFileTypes = {
  'png': 'image/png',
  'jpeg': 'image/jpeg',
  'bmp': 'image/bmp',
  'gif': 'image/gif',
  'tiff': 'image/tiff',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'odt': 'application/vnd.oasis.opendocument.text'
}

@app.post("/convert_word_file")
async def convert_word_file(file: UploadFile = File(...), output_format: str = Form(...)) -> FileResponse:
  """
  Convert a word file to the specified output format.
  
  Args:
    file: UploadFile object containing the file to convert
    output_format: Desired output format

  Returns:
    FileResponse with the converted file
  """
  if not file:
    raise HTTPException(status_code=400, detail="No File Uploaded.")

  print("Reading file...")
  contents = await file.read()
  filename = file.filename
  print(f"File read: {filename}, size: {len(contents)} bytes")

  input_ext = Path(filename).suffix.lower().lstrip('.')
  if input_ext not in supportedFileTypes:
    raise HTTPException(status_code=400, detail=f"Input file extension .{input_ext} is not supported.")

  detectedMime = magic.from_buffer(buffer=contents, mime=True)
  expectedMime = supportedFileTypes[input_ext]
  print(f"Detected file type: {detectedMime}, Expected file type: {expectedMime}")

  if detectedMime != expectedMime:
    # Special case for doc and docx
    if input_ext == "docx" and detectedMime in ['application/zip', 'application/json']:
      pass
    else:
      raise HTTPException(status_code=400, detail=f"File content type {detectedMime} does not match expected type {expectedMime} for extension .{input_ext}.")

  output_format = output_format.lower()
  supported_output_formats = ['pdf', 'doc', 'docx', 'odt']
  if output_format not in supported_output_formats:
    raise HTTPException(status_code=400, detail=f"Output format {output_format} is not supported.")

  fileType = supportedFileTypes[input_ext]
  print(f"Input file extension: {input_ext}, MIME type: {fileType}")
  if fileType not in supportedFileTypes.values():
    raise HTTPException(status_code=400, detail=f"Input format {fileType} is not supported.")
  
  print("File type is supported. Proceeding with conversion...")
  temp_dir = tempfile.mkdtemp()

  try:
    import shutil
    base_name = Path(filename).stem
    input_path = os.path.join(temp_dir, f"{base_name}.{input_ext}")
    print(f"Saving uploaded file to temporary path: {input_path}...")
    with open(input_path, 'wb') as f:
      f.write(contents)

    print(f"Creating output file path...")
    output_filename = f"{base_name}.{output_format}"
    output_path = os.path.join(temp_dir, output_filename)
    print(f"Output file will be saved to: {output_path}")

    if fileType == "application/pdf" and output_format == "docx":
      cv = Converter(input_path)
      cv.convert(output_path)
      cv.close()
    else:
      print("Running LibreOffice conversion...")
      command = [
        'libreoffice',
        '--headless',
        '--convert-to',
        output_format,
        '--outdir', temp_dir,
        input_path
      ]
      subprocess.run(command, check=True)
      print(f"LibreOffice conversion completed.")
      print(f"Contents of temp directory: {os.listdir(temp_dir)}")
      print(f"Looking for output file at: {output_path}")
    if not os.path.exists(output_path):
      raise HTTPException(status_code=500, detail="Conversion failed.")
    print("Conversion successful. Preparing file for download...")
    return FileResponse(
      path=output_path,
      filename=output_filename,
      media_type='application/octet-stream'
    )
  except subprocess.CalledProcessError as e:
    shutil.rmtree(temp_dir, ignore_errors=True)
    raise HTTPException(status_code=500, detail=f"Error during conversion: {e}")
  except Exception as e:
    shutil.rmtree(temp_dir, ignore_errors=True)
    raise HTTPException(status_code=500, detail=f"Error converting file: {e}")

@app.post("/convert_image_file")
def convert_image_file(file: UploadFile = File(...), output_format: str = Form(...)) -> FileResponse:
  """
  Convert an image file to the specified output format.
  
  Args:
    file: The uploaded image file
    output_format: Desired output format
  
  Returns:
    FileResponse with the converted image
  """

  try:
    supporterdExtensions = ['jpeg', 'png', 'bmp', 'gif', 'tiff']
    output_format = output_format.lower()
    if output_format not in supporterdExtensions:
      raise ValueError(f"Output format {output_format} is not supported.")
    with Image.open(file.file) as img:
      if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
      temp_dir = tempfile.mkdtemp()
      output_filename = f"{Path(file.filename).stem}.{output_format}"
      output_path = os.path.join(temp_dir, output_filename)
      img.save(output_path, format=output_format)
      return FileResponse(
        path=output_path,
        filename=output_filename,
        media_type='application/octet-stream'
      )
  except Exception as e:
    raise ValueError(f"Error converting image: {e}")
  return 0

@app.get("/formats/{extension}")
def get_available_formats(extension: str):
  """
  Get available output formats for a given file extension.

  Args:
    extension: The input file extension (e.g., 'pdf', 'png')

  Returns:
    JSON with available output formats
  """
  ext = extension.lower()

  document_formats = ['pdf', 'doc', 'docx', 'odt']
  if ext in document_formats:
    if ext == 'pdf':
      return {"formats": ['docx']}
    else:
      return {"formats": ['pdf']}

  image_formats = ['jpeg', 'png', 'bmp', 'gif', 'tiff']
  if ext in image_formats:
    available = [f for f in image_formats if f != ext]
    return {"formats": available}

  return {"formats": []}

@app.head("/health")
def health_check():
  """
  Health check endpoint to verify the service is running.

  Returns:
    JSON indicating the service status
  """
  return {"status": "ok"}
