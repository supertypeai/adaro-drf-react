from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator

# Create your models here.
class Location(models.Model):
    name = models.CharField(max_length=50)
    title = models.CharField(max_length=50, default="loc-title", blank=True, null=True)
    longitude = models.FloatField()
    latitude = models.FloatField()

    def __str__(self):
        return self.name

class LocationData(models.Model):
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    date = models.DateField()
    hour = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(24)
        ],
        null=True, blank=True
    )
    measurement = models.FloatField(default=None, null=True, blank=True)

    def __str__(self):
        return str(self.location) + " - " + str(self.date) + " - " + str(self.hour)