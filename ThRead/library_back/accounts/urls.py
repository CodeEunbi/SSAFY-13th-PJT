from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('users/', views.user_list, name='user_list'),
    path('profile/', views.profile, name='profile'),
    path('follow/', views.follow_user, name='follow'),
    path('follow/<int:follow_id>/', views.unfollow_user, name='unfollow'),
    path('users/<int:user_id>/', views.user_detail, name='user_detail')
]
