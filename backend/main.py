from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pdf2docx import Converter
from PIL import Image
import subprocess
import os

app = FastAPI()

origins = ["*"]
app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

def convert_word_file(input_path: str, output_format: str) -> int:
  """
  Convert a word file to the specified output format.
  
  Args:
    input_path: Path to the input file 
    output_format: Desired output format
  
  Returns:
    Int status code
  """
  output_format = output_format.lower()
  input_extension = input_path.split('.')[-1].lower()
  supportedExtensions = ['pdf', 'doc', 'docx', 'odt']

  if input_extension not in supportedExtensions:
    raise ValueError(f"Input format {input_extension} is not supported.")

  try:
    if input_extension == 'pdf' and output_format == 'docx':
      cv = Converter(input_path)
      filename = os.path.basename(input_path).replace('.pdf', '.docx')
      output_path = os.path.join('/tmp', filename)
      cv.convert(output_path)
      cv.close()
      return 0
    command = [
      'libreoffice',
      '--headless',
      '--convert-to',
      output_format,
      '--outdir', '/tmp',
      input_path
    ]
    subprocess.run(command, check=True)
    return 0
  except Exception as e:
    raise ValueError(f"Error converting file: {e}")

def convert_image_file(input_path: str, output_format: str) -> int:
  """
  Convert an image file to the specified output format.
  
  Args:
    input_path: Path to the input file 
    output_format: Desired output format
  
  Returns:
    Int status code
  """

  try:
    supporterdExtensions = ['jpeg', 'png', 'bmp', 'gif', 'tiff']
    if output_format.lower() not in supporterdExtensions:
      raise ValueError(f"Output format {output_format} is not supported.")
    with Image.open(input_path) as img:
      if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
      img.save(f"/tmp/{os.path.basename(input_path).split('.')[0]}.{output_format}")
  except Exception as e:
    raise ValueError(f"Error converting image: {e}")
  return 0

@app.get("/formats/{extension}")
def get_available_formats(extension: str):
  """
  Get available output formats for a given file extension.

  Args:
    extension: The input file extension (e.g., 'pdf', 'jpg', 'png')

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

  image_formats = ['jpeg', 'jpg', 'png', 'bmp', 'gif', 'tiff']
  if ext in image_formats:
    available = [f for f in image_formats if f != ext]
    return {"formats": available}

  return {"formats": []}

@app.get("/convert")
def convert():
  return {"message": "Converted", "result": None}