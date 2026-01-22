from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from .models import User, Follow
# from .models import User

# 회원 가입
class CustomRegisterSerializer(RegisterSerializer):
    birth_date = serializers.DateField(required=True)
    gender = serializers.CharField(required=False)
    mbti = serializers.CharField(max_length=4, required=False)
    
    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['birth_date'] = self.validated_data.get('birth_date', '')
        data['gender'] = self.validated_data.get('gender', '')
        data['mbti'] = self.validated_data.get('mbti', '')
        return data
    
    def save(self, request):
        user = super().save(request)
        user.birth_date = self.validated_data.get('birth_date', '')
        user.gender = self.validated_data.get('gender', '')
        user.mbti = self.validated_data.get('mbti', '')
        user.save()
        return user

# 사용자 조회
class UserSerializer(serializers.ModelSerializer):
    is_following = serializers.SerializerMethodField()
    follow_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'birth_date', 'gender', 'mbti', 'is_following', 'follow_id']

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(follower=request.user).exists()
        return False

    def get_follow_id(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            follow = obj.followers.filter(follower=request.user).first()
            return follow.id if follow else None
        return None


# 팔로우
class FollowSerializer(serializers.ModelSerializer):
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'is_following']
        read_only_fields = ['follower']

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.following.followers.filter(follower=request.user).exists()
    

