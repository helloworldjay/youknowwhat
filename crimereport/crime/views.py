from django.shortcuts import render, get_object_or_404, HttpResponse
from .models import Congressperson, Saying
from django.views.generic import DetailView, ListView
import json
from django.forms.models import model_to_dict
from django.http.response import JsonResponse
from pathlib import Path
import os


class CongressListView(ListView):
    model = Congressperson
    template_name = 'crime/index.html'
    context_object_name = "congresslist"  

def search(request, district):
    info_object = Congressperson.objects.get(district=district)
    saying_object = Saying.objects.order_by("?").first()
    if info_object:
        info_dict = model_to_dict(info_object)
        saying_dict = model_to_dict(saying_object)
        to_json = {**info_dict, **saying_dict}
        return JsonResponse(to_json)
