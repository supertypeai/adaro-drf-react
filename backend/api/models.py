from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.contrib.auth.models import AbstractUser, User
from django.utils.translation import gettext as _

User.email = models.EmailField(_("email"), blank=False, null=False, unique=True)

# Create your models here.
class Location(models.Model):

    CATEGORIES = [
        ("daily", "Daily"),
        ("six", "Six"),
        ("hourly", "Hourly"),
    ]

    name = models.CharField(max_length=50)
    title = models.CharField(max_length=50, default="loc-title", blank=True, null=True)
    longitude = models.FloatField()
    latitude = models.FloatField()
    category = models.CharField(max_length=10, choices=CATEGORIES, default="daily")

    def __str__(self):
        return self.name


class LocationData(models.Model):
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    date = models.DateField()
    hour = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(24)], null=True, blank=True
    )
    measurement = models.FloatField(default=None, null=True, blank=True)

    def __str__(self):
        return str(self.location) + " - " + str(self.date) + " - " + str(self.hour)
