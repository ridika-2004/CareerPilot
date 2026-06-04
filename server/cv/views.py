from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services.extract_text import extract_text
from .services.chunk_cv import chunk_cv
from .services.embed_store import embed_and_store, ask_with_rag
from .services.parse_cv import parse_cv_structured


class CVUploadView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id') or request.headers.get('X-User-Id')
        file = request.FILES.get('cv')

        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)
        if not file:
            return Response({'error': 'No file uploaded'}, status=400)

        allowed_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if file.content_type not in allowed_types:
            return Response({'error': 'Only PDF and DOCX allowed'}, status=400)

        try:
            file_bytes = file.read()
            raw_text = extract_text(file_bytes, file.content_type)
            chunks = chunk_cv(raw_text)
            stored = embed_and_store(chunks, user_id)

            sections = list(set(c['section'] for c in stored))
            parsed_cv = parse_cv_structured(raw_text)

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