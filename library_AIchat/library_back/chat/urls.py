from django.urls import path
from . import views

# base_url = 127.0.0.1:8000/api/

urlpatterns = [
    path('chat/', views.chat_api_view, name='ai_chat'), 
    path('chat/conversations/', views.get_or_create_conversation, name='conversation_list_create'),
    path('chat/conversations/<int:pk>/', views.conversation_detail, name='conversation_detail'),
    path('chat/conversations/<int:pk>/messages/', views.add_message, name='add_message'),
    path('chat/ensure_persona/', views.ensure_persona, name='ensure_persona'),
]