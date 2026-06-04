import fitz  # PyMuPDF
import docx
import io

def extract_text(file_bytes, content_type):
    if content_type == 'application/pdf':
        doc = fitz.open(stream=file_bytes, filetype='pdf')
        text = ''
        for page in doc:
            text += page.get_text()
        return text

    elif content_type in [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ]:
        doc = docx.Document(io.BytesIO(file_bytes))
        return '\n'.join([para.text for para in doc.paragraphs])

    raise ValueError('Unsupported file type. Upload PDF or DOCX.')