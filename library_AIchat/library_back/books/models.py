from django.db import models
from django.conf import settings


class Book(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    isbn = models.CharField(max_length=20)
    cover = models.URLField()
    publisher = models.CharField(max_length=100)
    pub_date = models.DateField()
    author = models.CharField(max_length=100)
    author_info = models.TextField()
    author_photo = models.URLField(blank=True, null=True)
    customer_review_rank = models.PositiveSmallIntegerField()
    subTitle = models.CharField(max_length=255, blank=True, null=True)
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    recommends = models.CharField(max_length=20, blank=True, null=True)
    mbti = models.ManyToManyField('Mbti', blank=True)

    def __str__(self):
        return self.title


class Mbti(models.Model):
    name = models.CharField(max_length=4, unique=True)

    def __str__(self):
        return self.name
    

class Category(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name
    
class Thread(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=200)
    content = models.TextField()
    reading_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title