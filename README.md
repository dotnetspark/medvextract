# LLM-Powered Medical Visit Action Extraction System

MedVextract is an AI-powered system, to aid VetRec extracting veterinary SOAP notes, follow-up tasks, medication instructions, client reminders, and veterinarian to-dos from consult transcripts. Built with BAML for LLM-powered extraction, FastAPI for the backend, and React for the frontend, it supports Practice Management System (PiMS) integration (e.g., Ezyvet), HIPAA/SOC 2 compliance, and scalability for multi-clinic veterinary practices.

## Features
- **SOAP Note Generation**: Automatically generates structured SOAP notes (Subjective, Objective, Assessment, Plan) and client-friendly discharge summaries.
- **Task Extraction**: Extracts follow-up tasks, medication instructions, client reminders, and vet to-dos from transcripts.
- **Customizable Templates**: Supports VetRec-style template selection for SOAP notes.
- **PiMS Integration**: Exports notes to systems like Ezyvet.
- **Multilingual Support**: Processes transcripts in multiple languages (e.g., English, Spanish).
- **Scalability**: Handles high traffic with Celery, Redis, PostgreSQL, and Kubernetes.
- **HIPAA Compliance**: Encrypts sensitive data and avoids logging PHI.
- **Interactive UI**: React frontend with VetRec-inspired blue/white design.
- **Swagger Documentation**: API documentation at `/docs`.

## Tech Stack
- **Backend**: FastAPI, Python, Celery, Redis, PostgreSQL
- **Frontend**: React, TypeScript, Material-UI
- **AI**: BAML with Grok3 for LLM-powered extraction
- **Infrastructure**: Docker, Kubernetes (optional)

## Prerequisites
- Python 3.11+
- Node.js 18+
- Redis
- PostgreSQL
- Docker (optional for containerization)

## Installation

### Backend
1. Clone the repository:
   ```bash
   git clone https://github.com/dotnetspark/medvextract.git
   cd medextract/backend
