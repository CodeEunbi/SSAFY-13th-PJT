from rest_framework import serializers
from .models import Thread, Book, Category

class ThreadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thread
        fields = '__all__'
        read_only_fields = ('book','user', 'created_at', 'updated_at')

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class BookSerializer(serializers.ModelSerializer):
    threads = ThreadSerializer(many=True, read_only=True, source='thread_set')
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'description', 'isbn', 'cover', 'publisher', 'pub_date',
            'author', 'author_info', 'author_photo', 'customer_review_rank', 'subTitle',
            'category', 'recommends', 'mbti', 'threads'
        ]