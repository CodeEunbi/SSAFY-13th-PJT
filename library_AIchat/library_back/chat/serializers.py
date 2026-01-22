from rest_framework import serializers
from books.models import Book
from .models import PersonaPrompt, Conversation, Message

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'


class PersonaPromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonaPrompt
        fields = ['id', 'book', 'prompt']


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'is_user', 'content', 'timestamp']


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'user', 'persona', 'created_at', 'updated_at', 'title', 'messages']
