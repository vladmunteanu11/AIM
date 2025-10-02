#!/usr/bin/env python3
"""
Create sample form submissions and complaints for testing
"""
import asyncio
import asyncpg
import sys
import os
import json
from datetime import datetime, timedelta
import random

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import get_settings

settings = get_settings()

async def create_sample_submissions():
    """Create sample form submissions for testing"""
    
    print("📋 Creating sample form submissions and complaints...")
    
    try:
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        
        conn = await asyncpg.connect(db_url)
        print("✅ Connected to PostgreSQL database")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return False
    
    try:
        # Sample citizen names
        citizen_names = [
            "Ion Popescu", "Maria Ionescu", "Gheorghe Radu", "Ana Dumitrescu",
            "Mihai Constantinescu", "Elena Stoica", "Alexandru Georgescu", "Carmen Popa"
        ]
        
        statuses = ["pending", "in_review", "approved", "completed", "rejected"]
        
        # Create sample form submissions
        for i in range(15):
            citizen_name = random.choice(citizen_names)
            status = random.choice(statuses)
            form_type_id = random.randint(1, 3)
            
            # Generate reference number
            ref_num = f"REQ-{2025}-{1000 + i:04d}"
            
            # Random date in the past 30 days
            days_ago = random.randint(0, 30)
            submitted_at = datetime.now() - timedelta(days=days_ago)
            
            submission_data = {
                "applicant_name": citizen_name,
                "property_address": f"Strada Libertății nr. {random.randint(1, 100)}",
                "purpose": "Pentru construire locuință",
                "phone": f"07{random.randint(10000000, 99999999)}"
            }
            
            await conn.execute("""
                INSERT INTO form_submissions 
                (form_type_id, citizen_name, citizen_email, citizen_phone, submission_data, 
                 status, reference_number, submitted_at, consent_given)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """, form_type_id, citizen_name, f"{citizen_name.lower().replace(' ', '.')}@email.ro",
                f"07{random.randint(10000000, 99999999)}", json.dumps(submission_data),
                status, ref_num, submitted_at, True)
        
        print("✅ Created 15 sample form submissions")

        # Create sample complaints
        complaint_titles = [
            "Groapă pe strada principală",
            "Gunoi aruncat în parc",
            "Becurile de iluminat nu funcționează",
            "Autobuzul întârzie constant",
            "Poluare fonică în zona centrală",
            "Canalizarea este înfundată",
            "Lipsa marcajelor pe drum",
            "Animale fără stăpân în cartier"
        ]
        
        complaint_statuses = ["submitted", "acknowledged", "in_progress", "resolved"]
        urgency_levels = ["low", "normal", "high"]
        
        for i in range(12):
            citizen_name = random.choice(citizen_names)
            title = random.choice(complaint_titles)
            status = random.choice(complaint_statuses)
            urgency = random.choice(urgency_levels)
            category_id = random.randint(1, 5)
            
            ref_num = f"COMP-{2025}-{2000 + i:04d}"
            days_ago = random.randint(0, 20)
            submitted_at = datetime.now() - timedelta(days=days_ago)
            
            await conn.execute("""
                INSERT INTO complaints
                (category_id, citizen_name, citizen_email, citizen_phone, title, description,
                 location_address, status, urgency_level, reference_number, submitted_at, 
                 consent_given, is_anonymous)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            """, category_id, citizen_name, f"{citizen_name.lower().replace(' ', '.')}@email.ro",
                f"07{random.randint(10000000, 99999999)}", title, 
                f"Descriere detaliată pentru {title.lower()}. Problema persistă de câteva zile și necesită atenție.",
                f"Strada {random.choice(['Mihai Viteazul', 'Independenței', 'Victoriei', 'Libertății'])} nr. {random.randint(1, 50)}",
                status, urgency, ref_num, submitted_at, True, random.choice([True, False]))
        
        print("✅ Created 12 sample complaints")
        
        print("\n🎉 Sample submissions and complaints created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        return False
    finally:
        await conn.close()

if __name__ == "__main__":
    success = asyncio.run(create_sample_submissions())
    sys.exit(0 if success else 1)