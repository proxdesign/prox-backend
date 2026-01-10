"""Authentication service for magic link auth."""
import os
import secrets
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import resend
from database.connection import db

# Configure Resend
resend.api_key = os.getenv("RESEND_API_KEY")

class AuthService:
    def __init__(self):
        self.jwt_secret = os.getenv("JWT_SECRET", "your-fallback-secret-key")
        self.app_url = os.getenv("APP_URL", "https://www.proxdesign.co")
        self.api_url = os.getenv("API_URL", "http://localhost:8001")
        self.token_expiry_minutes = 15
        self.jwt_expiry_days = 30
    
    def generate_magic_link_token(self) -> str:
        """Generate a secure random token for magic links."""
        return secrets.token_urlsafe(32)
    
    def send_magic_link_email(self, email: str, token: str, name: str = None) -> bool:
        """Send magic link email via Resend."""
        try:
            magic_link = f"{self.api_url}/auth/verify?token={token}"
            
            # Create personalized greeting
            greeting = f"Hi {name}!" if name else "Hi!"
            
            email_data = {
                "from": "Prox <noreply@proxdesign.co>",  # Will fallback to test domain if not configured
                "to": [email],
                "subject": "Sign in to Prox",
                "html": f"""
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #4a7c59; margin: 0; font-size: 32px; font-weight: 300;">Prox</h1>
                    </div>
                    
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px; font-weight: 400;">{greeting}</h2>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                        Click the button below to sign in to your Prox account:
                    </p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{magic_link}" 
                           style="background: #4a7c59; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 500; display: inline-block; font-size: 16px;">
                            Sign in to Prox
                        </a>
                    </div>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 14px; margin: 0 0 8px 0;">
                            This link expires in 15 minutes for security.
                        </p>
                        <p style="color: #999; font-size: 14px; margin: 0;">
                            If you didn't request this, you can safely ignore this email.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 40px;">
                        <p style="color: #ccc; font-size: 12px; margin: 0;">
                            — The Prox Team
                        </p>
                    </div>
                </div>
                """
            }
            
            # Try to send with custom domain first, fallback to test domain
            try:
                result = resend.Emails.send(email_data)
                return True
            except Exception as e:
                if "domain" in str(e).lower():
                    # Fallback to Resend test domain
                    email_data["from"] = "Prox <onboarding@resend.dev>"
                    result = resend.Emails.send(email_data)
                    return True
                else:
                    raise e
                    
        except Exception as e:
            print(f"Error sending magic link email: {e}")
            return False
    
    def create_magic_link(self, email: str, name: str = None) -> Dict[str, Any]:
        """Create a magic link token and store it in database."""
        try:
            # Generate token
            token = self.generate_magic_link_token()
            
            # Set expiry time
            expires_at = datetime.utcnow() + timedelta(minutes=self.token_expiry_minutes)
            
            # Store in database
            query = """
                INSERT INTO magic_links (email, token, name, expires_at)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """
            result = db.execute_query(query, [email.lower(), token, name, expires_at])
            
            if result:
                # Send email
                email_sent = self.send_magic_link_email(email, token, name)
                
                return {
                    "success": True,
                    "token": token,
                    "expires_at": expires_at,
                    "email_sent": email_sent,
                    "message": "Magic link sent! Check your email."
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to create magic link"
                }
                
        except Exception as e:
            print(f"Error creating magic link: {e}")
            return {
                "success": False,
                "message": "Failed to create magic link"
            }
    
    def verify_magic_link(self, token: str) -> Dict[str, Any]:
        """Verify magic link token and create user session."""
        try:
            # Find magic link
            query = """
                SELECT email, name, expires_at, used 
                FROM magic_links 
                WHERE token = %s
            """
            result = db.execute_query(query, [token])
            
            if not result:
                return {
                    "success": False,
                    "message": "Invalid magic link"
                }
            
            magic_link = result[0]
            
            # Check if expired
            if datetime.utcnow() > magic_link['expires_at']:
                return {
                    "success": False,
                    "message": "Magic link has expired"
                }
            
            # Check if already used
            if magic_link['used']:
                return {
                    "success": False,
                    "message": "Magic link has already been used"
                }
            
            # Mark as used
            update_query = "UPDATE magic_links SET used = TRUE WHERE token = %s"
            db.execute_query(update_query, [token])
            
            # Get or create user (using frontend database)
            user = self.get_or_create_user(magic_link['email'], magic_link['name'])
            
            if user:
                # Generate JWT token
                jwt_token = self.generate_jwt_token(user)
                
                return {
                    "success": True,
                    "user": user,
                    "token": jwt_token,
                    "message": "Successfully signed in"
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to create user account"
                }
                
        except Exception as e:
            print(f"Error verifying magic link: {e}")
            return {
                "success": False,
                "message": "Failed to verify magic link"
            }
    
    def get_or_create_user(self, email: str, name: str = None) -> Optional[Dict[str, Any]]:
        """Get or create user in the frontend database."""
        try:
            # This would need to connect to the frontend database
            # For now, we'll return a mock user structure
            # In production, you'd want to use the same database or make API calls
            
            return {
                "id": 1,
                "email": email,
                "name": name or "User",
                "created_at": datetime.utcnow().isoformat(),
                "preferences": {}
            }
            
        except Exception as e:
            print(f"Error getting/creating user: {e}")
            return None
    
    def generate_jwt_token(self, user: Dict[str, Any]) -> str:
        """Generate JWT token for user."""
        try:
            payload = {
                "user_id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "exp": datetime.utcnow() + timedelta(days=self.jwt_expiry_days),
                "iat": datetime.utcnow()
            }
            
            return jwt.encode(payload, self.jwt_secret, algorithm="HS256")
            
        except Exception as e:
            print(f"Error generating JWT token: {e}")
            return ""
    
    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return user data."""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            
            # Return user data from token
            return {
                "id": payload["user_id"],
                "email": payload["email"],
                "name": payload["name"]
            }
            
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
        except Exception as e:
            print(f"Error verifying JWT token: {e}")
            return None

# Global auth service instance
auth_service = AuthService()