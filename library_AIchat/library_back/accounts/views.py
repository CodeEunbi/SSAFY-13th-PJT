from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User, Follow
from .serializers import UserSerializer, FollowSerializer



# Create your views here.
# 1. 내 정보 조회 API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# 2. 다른 유저 목록 조회 API (본인 제외)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    users = User.objects.exclude(id=request.user.id)
    serializer = UserSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)


# 3. 팔로우 API
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_user(request):
    following_id = request.data.get('following')
    if not following_id:
        return Response({'error': 'following 필드가 필요합니다.'}, status=400)

    following = get_object_or_404(User, id=following_id)

    if request.user == following: 
        return Response({'error': '자기 자신은 팔로우할 수 없습니다.'}, status=400)

    follow, created = Follow.objects.get_or_create(
        follower=request.user,
        following=following,
    )
    if not created:
        return Response({'error': '이미 팔로우 중입니다.'}, status=400)

    serializer = FollowSerializer(follow, context={'request': request})
    return Response(serializer.data, status=201)

# 4. 언팔로우 API
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unfollow_user(request, follow_id):
    follow = get_object_or_404(Follow, id=follow_id, follower=request.user)
    follow.delete()
    return Response(status=204)

# 5. 특정 유저 상세 정보 조회 API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_detail(request, user_id):
    user= get_object_or_404(User, id=user_id)
    serializer = UserSerializer(user, context={'request':request})
    return Response(serializer.data)