from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework.response import Response
from .serializers import ThreadSerializer, BookSerializer
from .models import Thread, Book
from rest_framework import status
# from rest_framework.viewsets import ModelViewSet

# from django.http import JsonResponse

# Create your views here.
# def book_root(request):
#     return JsonResponse({"message": "Books API is working!"})

# 쓰레드 작성
@api_view(['POST'])
@permission_classes([IsAuthenticated])  # 로그인 필요
def create_thread(request, book_id):
    book = get_object_or_404(Book, pk=book_id)
    serializer = ThreadSerializer(data=request.data)
    print('로그인 된 유저:', request.user)
    if serializer.is_valid():
        serializer.save(user=request.user, book=book)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# 쓰레도 목록 전체 조회
@api_view(['GET'])
def thread_list(request):
    threads = Thread.objects.all()
    serializer = ThreadSerializer(threads, many=True)
    return Response(serializer.data)

# 내 쓰레드 조회
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_threads(request, user_id):
    if request.user.id != user_id:
        return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)

    threads = Thread.objects.filter(user__id=user_id)
    serializer = ThreadSerializer(threads, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])  # 인증 필요 없음
def thread_detail(request, thread_id):
    thread = get_object_or_404(Thread, pk=thread_id)
    serializer = ThreadSerializer(thread)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])  # 인증 필요 없음
def book_detail(request, book_id):
    book = get_object_or_404(Book, pk=book_id)
    serializer = BookSerializer(book)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])  # 누구나 접근 가능하게
def public_latest_threads(request):
    threads = Thread.objects.order_by('-id')[:3]
    serializer = ThreadSerializer(threads, many=True)
    return Response(serializer.data)