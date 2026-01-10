#!/bin/bash
cd prox_autonomous_discovery
uvicorn api.main:app --host 0.0.0.0 --port $PORT