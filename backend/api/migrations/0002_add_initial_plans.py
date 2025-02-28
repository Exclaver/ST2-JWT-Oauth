from django.db import migrations

def create_initial_plans(apps, schema_editor):
    Plan = apps.get_model('api', 'Plan')
    Profile = apps.get_model('api', 'Profile')

    free_plan = Plan.objects.create(name='free', price=0.00, requests_per_month=5, is_active=True)
    Plan.objects.create(name='basic', price=3.00, requests_per_month=600, is_active=True)
    Plan.objects.create(name='pro', price=10.00, requests_per_month=2000, is_active=True)

    # Update default credits in Profile model
    Profile._meta.get_field('credits_remaining').default = free_plan.requests_per_month

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_plans),
    ]