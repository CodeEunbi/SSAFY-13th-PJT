from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()

class PersonaPrompt(models.Model):
    book = models.ForeignKey('books.Book', on_delete=models.CASCADE, related_name='personas')
    prompt = models.TextField()

    def __str__(self):
        return f"Persona for {self.book.title}"


class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    persona = models.ForeignKey(PersonaPrompt, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)      # 마지막 메시지 시간
    title = models.CharField(max_length=255, blank=True, null=True)  # optional

    def __str__(self):
      return f"Conversation #{self.id} by {self.user.username}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    is_user = models.BooleanField()  # True = user 질문, False = AI 응답
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{'User' if self.is_user else 'AI'}: {self.content[:30]}"
