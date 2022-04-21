import csv
from django.core.management import BaseCommand
from api.models import Location, LocationData

class Command(BaseCommand):
    help = "Load data from csv file into database"

    def add_arguments(self, parser):
        parser.add_argument('--path', type=str)

    def handle(self, *args, **kwargs):
        path = kwargs['path']
        with open(path, 'rt') as f:
            reader = csv.reader(f, dialect="excel")
            next(reader, None)
            for row in reader:
                LocationData.objects.create(
                    location = Location.objects.get(name=row[1]),
                    date = row[2],
                    hour = row[3] if row[3] else None,
                    measurement = row[4] if row[4] else None
                )

# run in terminal:
# python manage.py load_data --path ./adaro-datasets/{location_name}.csv