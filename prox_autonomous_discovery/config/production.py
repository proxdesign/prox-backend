#!/usr/bin/env python3
"""Production configuration and environment setup."""

import os
from typing import Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path

@dataclass
class DatabaseConfig:
    """Database configuration settings."""
    host: str = "localhost"
    port: int = 5432
    name: str = "prox_discovery"
    user: str = "postgres"
    password: str = ""
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: int = 30
    ssl_mode: str = "prefer"

@dataclass
class AIConfig:
    """AI service configuration."""
    anthropic_api_key: str = ""
    model: str = "claude-3-5-haiku-20241022"
    max_tokens: int = 4000
    timeout: int = 30
    max_retries: int = 3

@dataclass
class APIConfig:
    """API configuration settings."""
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    reload: bool = False
    workers: int = 1
    access_log: bool = True
    cors_origins: list = None
    api_version: str = "v1"

@dataclass
class CacheConfig:
    """Cache configuration."""
    redis_url: str = "redis://localhost:6379/0"
    default_ttl: int = 300
    max_memory_cache: int = 1000
    enabled: bool = True

@dataclass
class SecurityConfig:
    """Security configuration."""
    secret_key: str = ""
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds
    allowed_hosts: list = None
    api_key: str = ""

@dataclass
class LoggingConfig:
    """Logging configuration."""
    level: str = "INFO"
    format: str = "%(asctime)s | %(name)s | %(levelname)s | %(message)s"
    file_path: str = "logs/prox_api.log"
    max_file_size: int = 10485760  # 10MB
    backup_count: int = 5
    console_logging: bool = True

class ProxConfig:
    """Main configuration class."""
    
    def __init__(self, environment: str = None):
        self.environment = environment or os.getenv('PROX_ENV', 'development')
        self._load_config()
    
    def _load_config(self):
        """Load configuration based on environment."""
        
        # Database configuration
        self.database = DatabaseConfig(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', '5432')),
            name=os.getenv('DB_NAME', 'prox_discovery'),
            user=os.getenv('DB_USER', os.getenv('USER', 'postgres')),
            password=os.getenv('DB_PASSWORD', ''),
            pool_size=int(os.getenv('DB_POOL_SIZE', '10')),
            ssl_mode=os.getenv('DB_SSL_MODE', 'prefer')
        )
        
        # AI configuration
        self.ai = AIConfig(
            anthropic_api_key=os.getenv('ANTHROPIC_API_KEY', ''),
            model=os.getenv('AI_MODEL', 'claude-3-5-haiku-20241022'),
            max_tokens=int(os.getenv('AI_MAX_TOKENS', '4000')),
            timeout=int(os.getenv('AI_TIMEOUT', '30')),
            max_retries=int(os.getenv('AI_MAX_RETRIES', '3'))
        )
        
        # API configuration
        self.api = APIConfig(
            host=os.getenv('API_HOST', '0.0.0.0'),
            port=int(os.getenv('PORT', '8000')),
            debug=os.getenv('DEBUG', 'false').lower() == 'true',
            reload=os.getenv('RELOAD', 'false').lower() == 'true',
            workers=int(os.getenv('WORKERS', '1')),
            cors_origins=self._parse_list(os.getenv('CORS_ORIGINS', '*')),
            api_version=os.getenv('API_VERSION', 'v1')
        )
        
        # Cache configuration
        self.cache = CacheConfig(
            redis_url=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
            default_ttl=int(os.getenv('CACHE_TTL', '300')),
            enabled=os.getenv('CACHE_ENABLED', 'true').lower() == 'true'
        )
        
        # Security configuration
        self.security = SecurityConfig(
            secret_key=os.getenv('SECRET_KEY', self._generate_secret_key()),
            rate_limit_requests=int(os.getenv('RATE_LIMIT_REQUESTS', '100')),
            rate_limit_window=int(os.getenv('RATE_LIMIT_WINDOW', '60')),
            allowed_hosts=self._parse_list(os.getenv('ALLOWED_HOSTS', '*')),
            api_key=os.getenv('API_KEY', '')
        )
        
        # Logging configuration
        self.logging = LoggingConfig(
            level=os.getenv('LOG_LEVEL', 'INFO'),
            file_path=os.getenv('LOG_FILE', 'logs/prox_api.log'),
            console_logging=os.getenv('CONSOLE_LOGGING', 'true').lower() == 'true'
        )
        
        # Environment-specific overrides
        self._apply_environment_overrides()
    
    def _parse_list(self, value: str) -> list:
        """Parse comma-separated string into list."""
        if not value or value == '*':
            return ['*']
        return [item.strip() for item in value.split(',') if item.strip()]
    
    def _generate_secret_key(self) -> str:
        """Generate a secret key if none provided."""
        import secrets
        return secrets.token_urlsafe(32)
    
    def _apply_environment_overrides(self):
        """Apply environment-specific configuration overrides."""
        
        if self.environment == 'production':
            # Production overrides
            self.api.debug = False
            self.api.reload = False
            self.api.workers = max(2, int(os.getenv('WORKERS', '4')))
            self.logging.level = 'WARNING'
            self.logging.console_logging = False
            
        elif self.environment == 'development':
            # Development overrides
            self.api.debug = True
            self.api.reload = True
            self.api.workers = 1
            self.logging.level = 'DEBUG'
            
        elif self.environment == 'testing':
            # Testing overrides
            self.database.name = os.getenv('TEST_DB_NAME', 'prox_test')
            self.api.debug = True
            self.logging.level = 'DEBUG'
            self.cache.enabled = False
    
    def validate_config(self) -> Dict[str, Any]:
        """Validate configuration and return issues."""
        
        issues = []
        warnings = []
        
        # Check required environment variables
        required_vars = {
            'ANTHROPIC_API_KEY': self.ai.anthropic_api_key,
            'DB_PASSWORD': self.database.password if self.environment == 'production' else 'optional'
        }
        
        for var, value in required_vars.items():
            if not value and value != 'optional':
                issues.append(f"Missing required environment variable: {var}")
        
        # Check database connectivity
        try:
            from database.connection import DatabaseConnection
            db_test = DatabaseConnection(
                host=self.database.host,
                port=self.database.port,
                database=self.database.name,
                user=self.database.user,
                password=self.database.password
            )
            # Test connection would go here
            warnings.append("Database connectivity not tested in validation")
        except Exception as e:
            issues.append(f"Database configuration invalid: {str(e)}")
        
        # Check file permissions
        log_dir = Path(self.logging.file_path).parent
        if not log_dir.exists():
            try:
                log_dir.mkdir(parents=True, exist_ok=True)
            except Exception as e:
                issues.append(f"Cannot create log directory {log_dir}: {str(e)}")
        
        # Validate API configuration
        if self.api.port < 1024 and os.getuid() != 0:
            warnings.append(f"Port {self.api.port} requires root privileges")
        
        # Security checks
        if self.environment == 'production':
            if not self.security.secret_key or len(self.security.secret_key) < 32:
                issues.append("SECRET_KEY must be at least 32 characters in production")
            
            if '*' in self.security.allowed_hosts:
                warnings.append("ALLOWED_HOSTS=* is not recommended for production")
            
            if '*' in self.api.cors_origins:
                warnings.append("CORS_ORIGINS=* is not recommended for production")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary (excluding sensitive data)."""
        
        def mask_sensitive(value: str) -> str:
            if not value:
                return ""
            return value[:4] + "*" * (len(value) - 4) if len(value) > 4 else "***"
        
        return {
            "environment": self.environment,
            "database": {
                "host": self.database.host,
                "port": self.database.port,
                "name": self.database.name,
                "user": self.database.user,
                "password": mask_sensitive(self.database.password),
                "pool_size": self.database.pool_size
            },
            "ai": {
                "model": self.ai.model,
                "max_tokens": self.ai.max_tokens,
                "api_key": mask_sensitive(self.ai.anthropic_api_key)
            },
            "api": {
                "host": self.api.host,
                "port": self.api.port,
                "debug": self.api.debug,
                "workers": self.api.workers
            },
            "cache": {
                "enabled": self.cache.enabled,
                "ttl": self.cache.default_ttl
            },
            "security": {
                "rate_limit_requests": self.security.rate_limit_requests,
                "rate_limit_window": self.security.rate_limit_window,
                "secret_key": mask_sensitive(self.security.secret_key)
            }
        }

# Global configuration instance
config = ProxConfig()

def get_config() -> ProxConfig:
    """Get the current configuration."""
    return config

def create_env_file(environment: str = "production") -> str:
    """Create a .env template file for the specified environment."""
    
    env_template = f"""# Prox Autonomous Discovery - {environment.upper()} Environment Configuration
# Copy this file to .env and configure your values

# Environment
PROX_ENV={environment}

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=prox_discovery
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# AI Service Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# API Configuration
API_HOST=0.0.0.0
PORT=8000
DEBUG={'true' if environment == 'development' else 'false'}
WORKERS={'1' if environment == 'development' else '4'}

# CORS Configuration (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Security Configuration
SECRET_KEY=your_secret_key_here_at_least_32_characters
API_KEY=optional_api_key_for_authentication
ALLOWED_HOSTS=*

# Cache Configuration
REDIS_URL=redis://localhost:6379/0
CACHE_ENABLED=true
CACHE_TTL=300

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Logging Configuration
LOG_LEVEL={'DEBUG' if environment == 'development' else 'INFO'}
LOG_FILE=logs/prox_api.log
CONSOLE_LOGGING=true
"""
    
    filename = f".env.{environment}"
    with open(filename, 'w') as f:
        f.write(env_template)
    
    return filename

def main():
    """Configuration management CLI."""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python config/production.py <command> [args]")
        print("Commands:")
        print("  validate - Validate current configuration")
        print("  show - Show current configuration")
        print("  create-env <environment> - Create .env template file")
        return
    
    command = sys.argv[1]
    
    if command == "validate":
        validation = config.validate_config()
        print("Configuration Validation Results:")
        print("=" * 40)
        print(f"Valid: {'✅' if validation['valid'] else '❌'}")
        
        if validation['issues']:
            print("\n🚨 ISSUES:")
            for issue in validation['issues']:
                print(f"  - {issue}")
        
        if validation['warnings']:
            print("\n⚠️  WARNINGS:")
            for warning in validation['warnings']:
                print(f"  - {warning}")
        
        if validation['valid']:
            print("\n✅ Configuration is valid!")
        else:
            print(f"\n❌ Configuration has {len(validation['issues'])} issues that must be fixed")
    
    elif command == "show":
        import json
        config_dict = config.to_dict()
        print("Current Configuration:")
        print("=" * 40)
        print(json.dumps(config_dict, indent=2))
    
    elif command == "create-env":
        environment = sys.argv[2] if len(sys.argv) > 2 else "production"
        filename = create_env_file(environment)
        print(f"Created environment template: {filename}")
        print("Please edit this file with your actual configuration values")
    
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()