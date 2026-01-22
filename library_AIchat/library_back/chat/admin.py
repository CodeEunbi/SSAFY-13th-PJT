from django.contrib import admin
from .models import PersonaPrompt, Conversation, Message

admin.site.register(PersonaPrompt)
admin.site.register(Conversation)
admin.site.register(Message)
