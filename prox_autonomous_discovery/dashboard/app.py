#!/usr/bin/env python3
"""
Prox System Dashboard
Comprehensive web interface for monitoring and managing the Prox data collection system.
"""

import os
import sys
import json
import subprocess
import threading
from datetime import datetime, timedelta
from pathlib import Path

from flask import Flask, render_template, jsonify, request, redirect, url_for, flash
from flask_cors import CORS

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from database.connection import db
from scripts.health_monitor import HealthMonitor
from scripts.send_alerts import AlertManager

app = Flask(__name__)
app.secret_key = 'prox-dashboard-secret-key-change-in-production'
CORS(app)

# Global cache for expensive operations
_cache = {}
_cache_timeout = 300  # 5 minutes


def get_cached_or_execute(key, func, timeout=None):
    """Get cached result or execute function and cache it."""
    if timeout is None:
        timeout = _cache_timeout
        
    now = datetime.now()
    
    if key in _cache:
        cached_time, result = _cache[key]
        if (now - cached_time).total_seconds() < timeout:
            return result
            
    # Execute function and cache result
    result = func()
    _cache[key] = (now, result)
    return result


def run_script_safely(script_path, args=None):
    """Run a script safely and return result."""
    try:
        project_root = Path(__file__).parent.parent
        pythonpath = "/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery"
        
        cmd = [
            'python3', str(project_root / script_path)
        ]
        
        if args:
            cmd.extend(args)
            
        env = os.environ.copy()
        env['PYTHONPATH'] = pythonpath
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
            cwd=project_root,
            env=env
        )
        
        return {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode
        }
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'Script timed out',
            'stdout': '',
            'stderr': 'Operation timed out after 60 seconds'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'stdout': '',
            'stderr': str(e)
        }


@app.route('/')
def dashboard():
    """Main dashboard page."""
    return render_template('dashboard.html')


@app.route('/api/health')
def api_health():
    """Get system health status."""
    def get_health():
        monitor = HealthMonitor()
        is_healthy = monitor.run_health_checks()
        
        return {
            'status': monitor.status,
            'is_healthy': is_healthy,
            'checks': monitor.checks,
            'alerts': [
                {
                    **alert,
                    'timestamp': alert['timestamp'].isoformat()
                }
                for alert in monitor.alerts
            ],
            'timestamp': datetime.now().isoformat()
        }
        
    return jsonify(get_cached_or_execute('health', get_health, 60))


@app.route('/api/collection-stats')
def api_collection_stats():
    """Get data collection statistics."""
    def get_stats():
        try:
            # Recent collection stats
            recent_stats = db.fetch_all("""
                SELECT 
                    platform,
                    COUNT(*) as post_count,
                    MAX(created_at) as latest_post,
                    MIN(created_at) as earliest_post
                FROM platform_posts 
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY platform
                ORDER BY post_count DESC
            """)
            
            # Total stats
            total_stats = db.fetch_one("""
                SELECT 
                    COUNT(*) as total_posts,
                    COUNT(DISTINCT platform) as platform_count,
                    MIN(created_at) as first_post,
                    MAX(created_at) as latest_post
                FROM platform_posts
            """)
            
            # Collection runs if table exists
            collection_runs = []
            try:
                runs = db.fetch_all("""
                    SELECT 
                        start_time,
                        end_time,
                        posts_collected,
                        duration_seconds
                    FROM collection_runs
                    ORDER BY start_time DESC
                    LIMIT 10
                """)
                
                collection_runs = [
                    {
                        'start_time': run[0].isoformat() if run[0] else None,
                        'end_time': run[1].isoformat() if run[1] else None,
                        'posts_collected': run[2],
                        'duration_seconds': run[3]
                    }
                    for run in runs
                ] if runs else []
            except:
                pass
            
            return {
                'recent_stats': [
                    {
                        'platform': stat[0],
                        'post_count': stat[1],
                        'latest_post': stat[2].isoformat() if stat[2] else None,
                        'earliest_post': stat[3].isoformat() if stat[3] else None
                    }
                    for stat in recent_stats
                ] if recent_stats else [],
                'total_stats': {
                    'total_posts': total_stats[0] if total_stats else 0,
                    'platform_count': total_stats[1] if total_stats else 0,
                    'first_post': total_stats[2].isoformat() if total_stats and total_stats[2] else None,
                    'latest_post': total_stats[3].isoformat() if total_stats and total_stats[3] else None
                } if total_stats else {},
                'collection_runs': collection_runs,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
            
    return jsonify(get_cached_or_execute('collection_stats', get_stats, 120))


@app.route('/api/trending-products')
def api_trending_products():
    """Get trending product statistics."""
    def get_trending():
        try:
            # Top trending products
            trending = db.fetch_all("""
                SELECT 
                    product_name,
                    brand,
                    trend_score,
                    price,
                    last_updated
                FROM products
                WHERE active = TRUE
                ORDER BY trend_score DESC
                LIMIT 20
            """)
            
            # Trend score distribution
            score_distribution = db.fetch_all("""
                SELECT 
                    CASE 
                        WHEN trend_score >= 9 THEN '9-10'
                        WHEN trend_score >= 8 THEN '8-9'
                        WHEN trend_score >= 7 THEN '7-8'
                        WHEN trend_score >= 6 THEN '6-7'
                        WHEN trend_score >= 5 THEN '5-6'
                        ELSE '<5'
                    END as score_range,
                    COUNT(*) as product_count
                FROM products
                WHERE active = TRUE
                GROUP BY score_range
                ORDER BY score_range DESC
            """)
            
            return {
                'trending_products': [
                    {
                        'product_name': p[0],
                        'brand': p[1],
                        'trend_score': float(p[2]) if p[2] else 0,
                        'price': float(p[3]) if p[3] else 0,
                        'last_updated': p[4].isoformat() if p[4] else None
                    }
                    for p in trending
                ] if trending else [],
                'score_distribution': [
                    {
                        'score_range': s[0],
                        'product_count': s[1]
                    }
                    for s in score_distribution
                ] if score_distribution else [],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
            
    return jsonify(get_cached_or_execute('trending_products', get_trending, 300))


@app.route('/api/automation-status')
def api_automation_status():
    """Get automation service status."""
    def get_automation_status():
        try:
            # Check macOS LaunchDaemon status
            services = []
            
            for service_name in ['com.prox.datacollection', 'com.prox.trendscoring']:
                try:
                    result = subprocess.run(
                        ['sudo', 'launchctl', 'list', service_name],
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    
                    is_running = result.returncode == 0
                    services.append({
                        'name': service_name,
                        'status': 'running' if is_running else 'stopped',
                        'output': result.stdout.strip()
                    })
                    
                except Exception as e:
                    services.append({
                        'name': service_name,
                        'status': 'unknown',
                        'error': str(e)
                    })
            
            # Check log files
            logs_dir = Path(__file__).parent.parent / 'logs'
            log_files = []
            
            if logs_dir.exists():
                for log_file in logs_dir.glob('*.log'):
                    stat = log_file.stat()
                    log_files.append({
                        'name': log_file.name,
                        'size_mb': stat.st_size / (1024 * 1024),
                        'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                    })
                    
            return {
                'services': services,
                'log_files': log_files,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
            
    return jsonify(get_cached_or_execute('automation_status', get_automation_status, 30))


@app.route('/api/run-collection', methods=['POST'])
def api_run_collection():
    """Manually trigger data collection."""
    result = run_script_safely('scripts/run_collection.py')
    return jsonify(result)


@app.route('/api/run-trend-scoring', methods=['POST'])
def api_run_trend_scoring():
    """Manually trigger trend scoring."""
    result = run_script_safely('scripts/run_trend_scoring.py')
    return jsonify(result)


@app.route('/api/test-health', methods=['POST'])
def api_test_health():
    """Test system health."""
    result = run_script_safely('scripts/run_collection.py', ['--test'])
    return jsonify(result)


@app.route('/api/send-test-alert', methods=['POST'])
def api_send_test_alert():
    """Send test alert."""
    try:
        alert_manager = AlertManager()
        success = alert_manager.send_alert(
            "Test Alert from Dashboard",
            "This is a test alert sent from the Prox dashboard.",
            "info"
        )
        
        return jsonify({
            'success': success,
            'message': 'Test alert sent successfully' if success else 'Failed to send test alert'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })


@app.route('/api/clear-cache', methods=['POST'])
def api_clear_cache():
    """Clear dashboard cache."""
    global _cache
    _cache.clear()
    return jsonify({'success': True, 'message': 'Cache cleared'})


@app.route('/api/export-health-report')
def api_export_health_report():
    """Export detailed health report."""
    try:
        monitor = HealthMonitor()
        monitor.run_health_checks()
        
        report = {
            'export_time': datetime.now().isoformat(),
            'status': monitor.status,
            'checks': monitor.checks,
            'alerts': [
                {
                    **alert,
                    'timestamp': alert['timestamp'].isoformat()
                }
                for alert in monitor.alerts
            ]
        }
        
        from flask import make_response
        response = make_response(json.dumps(report, indent=2))
        response.headers['Content-Type'] = 'application/json'
        response.headers['Content-Disposition'] = f'attachment; filename=health_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/api/agent-status')
def api_agent_status():
    """Get status of all autonomous agents."""
    def get_agent_status():
        try:
            # Get last run for each agent
            agent_logs = db.fetch_all("""
                SELECT DISTINCT ON (agent_name)
                    agent_name,
                    started_at,
                    completed_at,
                    duration_seconds,
                    items_processed,
                    items_affected,
                    success,
                    details,
                    errors
                FROM agent_logs
                WHERE started_at >= NOW() - INTERVAL '7 days'
                ORDER BY agent_name, started_at DESC
            """)
            
            agents = []
            for log in agent_logs:
                agent_data = {
                    "name": log[0],
                    "last_run": log[1].isoformat() if log[1] else None,
                    "completed": log[2].isoformat() if log[2] else None,
                    "duration": log[3],
                    "processed": log[4] or 0,
                    "affected": log[5] or 0,
                    "success": log[6],
                    "status": "success" if log[6] else "error",
                    "details": log[7] if log[7] else {},
                    "errors": log[8] if log[8] else []
                }
                agents.append(agent_data)
            
            # Get agent run frequency (last 24h)
            recent_runs = db.fetch_all("""
                SELECT 
                    agent_name,
                    COUNT(*) as run_count,
                    MAX(started_at) as last_run,
                    AVG(duration_seconds) as avg_duration
                FROM agent_logs
                WHERE started_at >= NOW() - INTERVAL '24 hours'
                GROUP BY agent_name
                ORDER BY agent_name
            """)
            
            frequency_data = {}
            for run in recent_runs:
                frequency_data[run[0]] = {
                    "runs_24h": run[1],
                    "last_run": run[2].isoformat() if run[2] else None,
                    "avg_duration": round(run[3], 2) if run[3] else 0
                }
            
            return {
                "agents": agents,
                "frequency": frequency_data,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"error": str(e), "timestamp": datetime.now().isoformat()}
    
    return jsonify(get_cached_or_execute('agent_status', get_agent_status, 60))


@app.route('/api/run-agent/<agent_name>', methods=['POST'])
def api_run_agent(agent_name):
    """Manually trigger an agent."""
    try:
        # Import agent scheduler
        from agents.scheduler import AgentScheduler
        
        # Valid agent names
        valid_agents = ['link_health_monitor', 'quality_auditor', 'trend_decay', 'cost_optimizer']
        
        if agent_name not in valid_agents:
            return jsonify({
                "error": f"Invalid agent name. Valid options: {valid_agents}"
            }), 400
        
        # Run agent in background thread
        def run_agent_background():
            try:
                scheduler = AgentScheduler(blocking=False)
                result = scheduler.run_agent(agent_name)
                print(f"Agent {agent_name} completed: {result}")
            except Exception as e:
                print(f"Agent {agent_name} failed: {e}")
        
        thread = threading.Thread(target=run_agent_background)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "status": "started",
            "agent": agent_name,
            "message": f"Agent {agent_name} has been triggered",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/agent-logs')
def api_agent_logs():
    """Get recent agent logs with pagination."""
    def get_logs():
        try:
            # Get query parameters
            limit = min(int(request.args.get('limit', 50)), 200)  # Max 200
            offset = int(request.args.get('offset', 0))
            agent_name = request.args.get('agent_name')
            
            # Build query
            where_clause = ""
            params = []
            
            if agent_name:
                where_clause = "WHERE agent_name = %s"
                params.append(agent_name)
            
            # Get logs
            logs = db.fetch_all(f"""
                SELECT 
                    agent_name,
                    action_type,
                    started_at,
                    completed_at,
                    duration_seconds,
                    items_processed,
                    items_affected,
                    success,
                    details,
                    errors
                FROM agent_logs
                {where_clause}
                ORDER BY started_at DESC
                LIMIT %s OFFSET %s
            """, params + [limit, offset])
            
            # Format logs
            formatted_logs = []
            for log in logs:
                formatted_logs.append({
                    "agent_name": log[0],
                    "action_type": log[1],
                    "started_at": log[2].isoformat() if log[2] else None,
                    "completed_at": log[3].isoformat() if log[3] else None,
                    "duration_seconds": log[4],
                    "items_processed": log[5],
                    "items_affected": log[6],
                    "success": log[7],
                    "details": log[8] if log[8] else {},
                    "errors": log[9] if log[9] else []
                })
            
            # Get total count
            count_query = f"SELECT COUNT(*) FROM agent_logs {where_clause}"
            total_count = db.fetch_one(count_query, params[:len(params)-2] if params else [])
            
            return {
                "logs": formatted_logs,
                "total_count": total_count[0] if total_count else 0,
                "limit": limit,
                "offset": offset,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"error": str(e), "timestamp": datetime.now().isoformat()}
    
    return jsonify(get_logs())  # Don't cache logs, always fresh


@app.route('/api/test-status')
def api_test_status():
    """Get latest E2E test run status."""
    try:
        # Get latest test run
        latest_run = db.execute_query("""
            SELECT run_id, total_tests, passed, failed, skipped, 
                   duration_seconds, started_at, completed_at, triggered_by
            FROM test_runs 
            ORDER BY started_at DESC 
            LIMIT 1
        """)
        
        if not latest_run:
            return jsonify({
                'status': 'no_runs',
                'message': 'No test runs found',
                'timestamp': datetime.now().isoformat()
            })
        
        latest_run = latest_run[0]  # Get first (and only) result
        run_id = latest_run['run_id']
        
        # Get all test results for this run
        test_results = db.execute_query("""
            SELECT test_name, test_category, status, duration_seconds, 
                   error_message, details, created_at
            FROM test_results 
            WHERE test_run_id = %s
            ORDER BY created_at
        """, (run_id,))
        
        # Format results
        results = []
        for result in test_results:
            results.append({
                'test_name': result['test_name'],
                'category': result['test_category'],
                'status': result['status'],
                'duration': result['duration_seconds'],
                'error': result['error_message'],
                'details': result['details'],
                'created_at': result['created_at'].isoformat() if result['created_at'] else None
            })
        
        # Determine overall status
        overall_status = "passing" if latest_run['failed'] == 0 else "failing"
        
        return jsonify({
            'status': overall_status,
            'last_run': latest_run['started_at'].isoformat() if latest_run['started_at'] else None,
            'run_id': run_id,
            'total': latest_run['total_tests'],
            'passed': latest_run['passed'],
            'failed': latest_run['failed'],
            'skipped': latest_run['skipped'],
            'duration': latest_run['duration_seconds'],
            'triggered_by': latest_run['triggered_by'],
            'completed_at': latest_run['completed_at'].isoformat() if latest_run['completed_at'] else None,
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        })


@app.route('/api/test-history')
def api_test_history():
    """Get test run history."""
    try:
        limit = min(int(request.args.get('limit', 10)), 50)  # Max 50
        
        history = db.execute_query("""
            SELECT run_id, total_tests, passed, failed, skipped, 
                   duration_seconds, started_at, completed_at, triggered_by
            FROM test_runs 
            ORDER BY started_at DESC 
            LIMIT %s
        """, (limit,))
        
        runs = []
        for run in history:
            runs.append({
                'run_id': run['run_id'],
                'total': run['total_tests'],
                'passed': run['passed'],
                'failed': run['failed'],
                'skipped': run['skipped'],
                'duration': run['duration_seconds'],
                'started_at': run['started_at'].isoformat() if run['started_at'] else None,
                'completed_at': run['completed_at'].isoformat() if run['completed_at'] else None,
                'triggered_by': run['triggered_by'],
                'status': 'passing' if run['failed'] == 0 else 'failing'
            })
        
        return jsonify({
            'runs': runs,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        })


@app.route('/api/run-tests', methods=['POST'])
def api_run_tests():
    """Trigger E2E tests in background."""
    try:
        # Generate unique run ID
        run_id = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Get test options from request
        data = request.get_json() or {}
        test_mode = data.get('mode', 'default')  # quick, default, full
        
        # Determine pytest command based on mode
        base_cmd = ['python3', '/Volumes/Dave\'s Mac/prox-product-discovery/run_e2e_tests.py']
        
        if test_mode == 'quick':
            base_cmd.append('--quick')
        elif test_mode == 'full':
            base_cmd.append('--full')
        
        base_cmd.extend(['--skip-service-check'])
        
        def run_tests_background():
            """Run tests in background thread."""
            try:
                # Set working directory and environment
                project_root = '/Volumes/Dave\'s Mac/prox-product-discovery'
                
                result = subprocess.run(
                    base_cmd,
                    cwd=project_root,
                    capture_output=True,
                    text=True,
                    timeout=600  # 10 minute timeout
                )
                
                print(f"Test run {run_id} completed with exit code {result.returncode}")
                if result.stdout:
                    print("STDOUT:", result.stdout)
                if result.stderr:
                    print("STDERR:", result.stderr)
                    
            except subprocess.TimeoutExpired:
                print(f"Test run {run_id} timed out after 10 minutes")
            except Exception as e:
                print(f"Test run {run_id} failed: {e}")
        
        # Start background thread
        thread = threading.Thread(target=run_tests_background, daemon=True)
        thread.start()
        
        return jsonify({
            'status': 'started',
            'run_id': run_id,
            'mode': test_mode,
            'message': f'E2E tests started in {test_mode} mode',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        })


def run_app():
    """Run the Flask application."""
    # Ensure logs directory exists
    logs_dir = Path(__file__).parent.parent / 'logs'
    logs_dir.mkdir(exist_ok=True)
    
    print("🚀 Starting Prox Dashboard...")
    print("📊 Dashboard will be available at: http://localhost:5555")
    print("🔄 Use Ctrl+C to stop the dashboard")
    
    app.run(
        host='127.0.0.1',
        port=5555,
        debug=False,
        threaded=True
    )


if __name__ == '__main__':
    run_app()