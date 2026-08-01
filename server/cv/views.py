import os
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .mongo_models import CVUploadRecord
from .services.extract_text import extract_text
from .services.chunk_cv import chunk_cv
from .services.embed_store import embed_and_store, ask_with_rag
from .services.parse_cv import parse_cv_structured
from users.mongo_models import MongoUser

# Map file extensions to canonical MIME types
EXT_TO_MIME = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
ALLOWED_MIME_TYPES = set(EXT_TO_MIME.values())


def resolve_file_type(file):
    """Determine the canonical MIME type using content_type + filename extension fallback."""
    content_type = file.content_type
    if content_type in ALLOWED_MIME_TYPES:
        return content_type

    # Fallback: check file extension
    _, ext = os.path.splitext(file.name or '')
    ext = ext.lower()
    if ext in EXT_TO_MIME:
        return EXT_TO_MIME[ext]

    return None


class CVUploadView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id') or request.headers.get('X-User-Id')
        file = request.FILES.get('cv')

        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)
        if not file:
            return Response({'error': 'No file uploaded'}, status=400)

        resolved_type = resolve_file_type(file)
        if not resolved_type:
            return Response(
                {'error': f'Unsupported file type ({file.content_type}). Only PDF and DOCX are allowed.'},
                status=400
            )

        try:
            file_bytes = file.read()
            raw_text = extract_text(file_bytes, resolved_type)
            chunks = chunk_cv(raw_text)
            stored = embed_and_store(chunks, user_id)

            sections = list(set(c['section'] for c in stored))
            parsed_cv = parse_cv_structured(raw_text)

            # Resolve username for the record
            username = ""
            try:
                mu = MongoUser.objects.get(id=user_id)
                username = mu.username
            except Exception:
                pass

            CVUploadRecord(
                user_id=str(user_id),
                username=username,
                file_name=file.name or "unknown",
                file_type=resolved_type,
                chunks_stored=len(stored),
                cv_summary=json.dumps(parsed_cv),
            ).save()

            return Response({
                'message': 'CV processed successfully',
                'chunks_stored': len(stored),
                'sections': sections,
                'parsed_cv': parsed_cv
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)


class CVAskView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id')
        question = request.data.get('question')

        if not user_id or not question:
            return Response({'error': 'user_id and question are required'}, status=400)

        try:
            result = ask_with_rag(user_id, question)
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class CVStatusView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')

        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)

        try:
            record = CVUploadRecord.objects(user_id=str(user_id)).order_by('-uploaded_at').first()
            if not record:
                return Response({'uploaded': False})

            parsed_cv = None
            if record.cv_summary:
                try:
                    parsed_cv = json.loads(record.cv_summary)
                except Exception:
                    parsed_cv = None

            return Response({
                'uploaded': True,
                'file_name': record.file_name,
                'chunks_stored': record.chunks_stored,
                'sections': list(parsed_cv.keys()) if isinstance(parsed_cv, dict) else [],
                'parsed_cv': parsed_cv,
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)
