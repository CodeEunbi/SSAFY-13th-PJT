from django.conf import settings

from chat.serializers import MessageSerializer
from openai import OpenAI
from openai import OpenAIError


from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView


# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Conversation, PersonaPrompt
from books.models import Book
from .models import Message
import json

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


# import os
# from dotenv import load_dotenv

# load_dotenv()
# print(os.getenv("OPENAI_API_KEY"))

# Create your views here.
# @csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_api_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST 요청만 지원합니다.'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': '유효하지 않은 JSON입니다.'}, status=400)

    book_data = data.get("book", {})
    book_id = book_data.get("pk")
    book_content = book_data.get("content", "")
    author_info = book_data.get("author_info", "") 
    question = data.get("question", "")


    # book_content = data.get("book", {}).get("content", "")
    # author_info = data.get("author", {}).get("info", "")
    # question = data.get("question", "")
    # book_id = book_content.get("pk")

    if not question:
        return JsonResponse({"error": "질문이 필요합니다."}, status=400)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': '로그인이 필요합니다.'}, status=401)

 

    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        return JsonResponse({'error': '책을 찾을 수 없습니다.'}, status=404)



    # ✅ PersonaPrompt 가져오기 또는 생성
    persona, _ = PersonaPrompt.objects.get_or_create(
        book=book,
        defaults={'prompt': f"당신은 '{book.title}'의 작가입니다. 이 책에 대해 사용자에게 안내하세요."}
    )

    # ✅ Conversation 가져오기 또는 생성
    conversation, _ = Conversation.objects.get_or_create(
        user=request.user,
        persona=persona,
    )

    # ✅ 프롬프트 구성
    prompt = f"""당신은 이 책의 작가로써, 이 책에 대한 내용과 작가의 배경을 토대로 답변하는 작가AI 입니다.
책 내용: {book_content}
저자 정보: {author_info}
사용자 질문: {question}
3줄 이내로 설명해줘. 추가 정보는 인터넷에서 검색하고, 정확한 정보가 아니라면 너의 추론이라고 꼭 붙여서 대답해줘.
답변:"""


    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 책에 대해 잘 아는 도우미입니다."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.1,
        )
        answer = response.choices[0].message.content.strip()

        # ✅ 메시지 저장
        Message.objects.create(
            conversation=conversation,
            is_user=True,
            content=question
        )
        Message.objects.create(
            conversation=conversation,
            is_user=False,
            content=answer
        )

        return JsonResponse({
            "answer": answer,
            "conversation_id": conversation.id
        })

    except OpenAIError as e:
        return JsonResponse({"error": str(e)}, status=500)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_or_create_conversation(request):
    user = request.user
    book_id = request.data.get('book_id')

    if not book_id:
        return Response({'error': 'book_id가 필요합니다.'}, status=400)

    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        return Response({'error': '해당 책을 찾을 수 없습니다.'}, status=404)

    persona = PersonaPrompt.objects.filter(book=book).first()
    if not persona:
        return Response({'error': '해당 책에 대한 페르소나가 없습니다.'}, status=404)

    conversation, created = Conversation.objects.get_or_create(
        user=user,
        persona=persona
    )

    messages = Message.objects.filter(conversation=conversation).order_by('timestamp')
    serialized = MessageSerializer(messages, many=True)

    return Response({
        'conversation_id': conversation.id,
        'messages': serialized.data,
        'created': created
    })
# def conversation_list_create(request):
#   if request.method == 'POST':
#       body = json.loads(request.body)
#       book_id = body.get('book_id')

#       try:
#           # 책이 존재하는지 확인
#           book = Book.objects.get(id=book_id)
#       except Book.DoesNotExist:
#           return JsonResponse({'error': 'Book not found'}, status=404)

#       # 해당 책의 persona가 없다면 자동 생성
#       persona, created = PersonaPrompt.objects.get_or_create(
#           book=book,
#           defaults={
#               'prompt': f"당신은 '{book.title}'의 저자입니다. 이 책에 대해 사용자에게 안내하세요."
#           }
#       )

#       # 대화 생성
#       conversation = Conversation.objects.create(user=request.user, persona=persona)
#       return JsonResponse({'id': conversation.id}, status=201)


def conversation_detail(request, pk):
    try:
        conversation = Conversation.objects.get(pk=pk, user=request.user)
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Conversation not found'}, status=404)

    messages = conversation.messages.all().order_by('timestamp')
    data = {
        'id': conversation.id,
        'title': conversation.title or conversation.persona.book.title,
        'messages': [
            {
                'id': m.id,
                'is_user': m.is_user,
                'content': m.content,
                'timestamp': m.timestamp,
            }
            for m in messages
        ]
    }
    return JsonResponse(data)


@csrf_exempt
def add_message(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)

    try:
        conversation = Conversation.objects.get(pk=pk, user=request.user)
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Conversation not found'}, status=404)

    body = json.loads(request.body)
    question = body.get('message')

    # 1. 유저 메시지 저장
    from .models import Message
    Message.objects.create(conversation=conversation, is_user=True, content=question)

    # 2. AI 응답 생성 (임시 응답으로 대체)
    ai_response = f"이건 '{question}'에 대한 임시 응답이야 :)"
    Message.objects.create(conversation=conversation, is_user=False, content=ai_response)

    return JsonResponse({'response': ai_response})


@csrf_exempt
def ensure_persona(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST 요청만 지원합니다.'}, status=405)

    try:
        data = json.loads(request.body)
        book_id = data.get("book_id")
        if not book_id:
            return JsonResponse({'error': 'book_id가 필요합니다.'}, status=400)

        book = Book.objects.get(id=book_id)

        persona, created = PersonaPrompt.objects.get_or_create(
            book=book,
            defaults={
                'prompt': f"당신은 '{book.title}'의 작가입니다. 이 책에 대해 사용자에게 안내하세요."
            }
        )

        return JsonResponse({
            'persona_id': persona.id,
            'created': created,
            'prompt': persona.prompt
        })

    except Book.DoesNotExist:
        return JsonResponse({'error': '책을 찾을 수 없습니다.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)