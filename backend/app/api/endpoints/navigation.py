"""
Endpoint-uri pentru navigarea și structura site-ului
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ...core.database import get_async_session
from ...models.content import ContentCategory, Page, AnnouncementCategory

router = APIRouter()


@router.get("/menu")
async def get_site_menu(
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Obține structura de meniu pentru site conform standardelor #DigiLocal
    """
    
    # Obține categoriile principale
    categories_query = select(ContentCategory).where(
        ContentCategory.is_active == True
    ).order_by(ContentCategory.menu_order, ContentCategory.name)
    
    categories_result = await db.execute(categories_query)
    categories = categories_result.scalars().all()
    
    # Obține paginile publice pentru fiecare categorie
    pages_query = select(Page).where(
        Page.status == 'published'
    ).order_by(Page.menu_order, Page.title)
    
    pages_result = await db.execute(pages_query)
    all_pages = pages_result.scalars().all()
    
    # Construire structură de meniu
    menu_structure = {
        "main_sections": [],
        "footer_links": [
            {
                "title": "Termeni și Condiții",
                "url": "/termeni-conditii",
                "external": False
            },
            {
                "title": "Politica de Confidențialitate", 
                "url": "/politica-confidentialitate",
                "external": False
            },
            {
                "title": "GDPR",
                "url": "/gdpr", 
                "external": False
            },
            {
                "title": "Accesibilitate",
                "url": "/accesibilitate",
                "external": False
            }
        ],
        "quick_links": [
            {
                "title": "Programări Online",
                "url": "/programari-online",
                "icon": "calendar",
                "color": "#004990"
            },
            {
                "title": "Plăți Online",
                "url": "/plati-online", 
                "icon": "credit-card",
                "color": "#0079C1"
            },
            {
                "title": "Formulare Online",
                "url": "/servicii-publice/formulare",
                "icon": "file-text",
                "color": "#28a745"
            },
            {
                "title": "Contact",
                "url": "/contact",
                "icon": "phone",
                "color": "#ffc107"
            }
        ]
    }
    
    # Structura obligatorie #DigiLocal
    digilocal_structure = [
        {
            "title": "Despre Primărie",
            "url": "/despre-primarie",
            "category_id": 1,
            "submenu": [
                {"title": "Organizare", "url": "/despre-primarie/organizare"},
                {"title": "Conducere", "url": "/despre-primarie/conducere"}, 
                {"title": "Strategia de Dezvoltare Locală", "url": "/despre-primarie/strategia-dezvoltare"}
            ]
        },
        {
            "title": "Informații de Interes Public",
            "url": "/informatii-interes-public",
            "category_id": 2,
            "submenu": [
                {"title": "Buget și Execuție Bugetară", "url": "/informatii-interes-public/buget"},
                {"title": "Achiziții Publice", "url": "/informatii-interes-public/achizitii"},
                {"title": "Taxe și Impozite Locale", "url": "/informatii-interes-public/taxe-impozite"}
            ]
        },
        {
            "title": "Transparență Decizională", 
            "url": "/transparenta-decizionala",
            "category_id": 3,
            "submenu": [
                {"title": "Proiecte de Hotărâri", "url": "/transparenta-decizionala/proiecte-hotarari"},
                {"title": "Ședințe ale Consiliului Local", "url": "/transparenta-decizionala/sedinte-consiliu"}
            ]
        },
        {
            "title": "Integritate Instituțională",
            "url": "/integritate-institutionala", 
            "category_id": 4,
            "submenu": [
                {"title": "Cod Etic/Deontologic", "url": "/integritate-institutionala/cod-etic"},
                {"title": "Plan de Integritate", "url": "/integritate-institutionala/plan-integritate"}
            ]
        },
        {
            "title": "Monitorul Oficial Local",
            "url": "/monitorul-oficial-local",
            "category_id": None,
            "submenu": [
                {"title": "Statutul Unității Administrativ-Teritoriale", "url": "/mol/categoria/1"},
                {"title": "Regulamentele privind procedurile administrative", "url": "/mol/categoria/2"},
                {"title": "Hotărârile autorității deliberative", "url": "/mol/categoria/3"},
                {"title": "Dispozițiile autorității executive", "url": "/mol/categoria/4"},
                {"title": "Documente și informații financiare", "url": "/mol/categoria/5"},
                {"title": "Alte documente", "url": "/mol/categoria/6"}
            ]
        },
        {
            "title": "Servicii Publice",
            "url": "/servicii-publice",
            "category_id": 5, 
            "submenu": [
                {"title": "Formulare Online", "url": "/servicii-publice/formulare"},
                {"title": "Programări Online", "url": "/servicii-publice/programari"},
                {"title": "Plata Taxelor și Impozitelor", "url": "/servicii-publice/plata-taxelor"},
                {"title": "Urbanism și Dezvoltare", "url": "/servicii-publice/urbanism"}
            ]
        },
        {
            "title": "Comunitate",
            "url": "/comunitate",
            "category_id": 6,
            "submenu": [
                {"title": "Educație, Cultură și Sănătate", "url": "/comunitate/educatie-cultura"},
                {"title": "Mediu și Turism", "url": "/comunitate/mediu-turism"}
            ]
        },
        {
            "title": "Anunțuri",
            "url": "/anunturi", 
            "category_id": None,
            "submenu": []
        }
    ]
    
    # Adăugare pagini existente în structură
    for section in digilocal_structure:
        if section["category_id"]:
            category_pages = [p for p in all_pages if p.category_id == section["category_id"]]
            for page in category_pages[:5]:  # Limităm la 5 pagini per secțiune
                section["submenu"].append({
                    "title": page.title,
                    "url": f"/pagina/{page.slug}",
                    "page_id": page.id
                })
    
    menu_structure["main_sections"] = digilocal_structure
    
    return menu_structure


@router.get("/breadcrumbs")
async def get_breadcrumbs(
    path: str,
    db: AsyncSession = Depends(get_async_session)
) -> List[Dict[str, str]]:
    """
    Obține breadcrumb-urile pentru o cale specifică
    """
    breadcrumbs = [{"title": "Acasă", "url": "/"}]
    
    # Parsare cale simplă
    path_parts = path.strip("/").split("/")
    current_path = ""
    
    # Mapare căi către titluri
    path_titles = {
        "despre-primarie": "Despre Primărie",
        "informatii-interes-public": "Informații de Interes Public", 
        "transparenta-decizionala": "Transparență Decizională",
        "integritate-institutionala": "Integritate Instituțională",
        "monitorul-oficial-local": "Monitorul Oficial Local",
        "servicii-publice": "Servicii Publice",
        "comunitate": "Comunitate",
        "anunturi": "Anunțuri",
        "contact": "Contact",
        "programari-online": "Programări Online",
        "plati-online": "Plăți Online"
    }
    
    for i, part in enumerate(path_parts):
        if part:
            current_path += "/" + part
            title = path_titles.get(part, part.replace("-", " ").title())
            
            breadcrumbs.append({
                "title": title,
                "url": current_path
            })
    
    return breadcrumbs


@router.get("/sitemap")
async def get_sitemap(
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Generează harta site-ului pentru SEO și navigare
    """
    
    # Obține toate paginile publicate
    pages_query = select(Page).options(
        selectinload(Page.category)
    ).where(
        Page.status == 'published'
    ).order_by(Page.category_id, Page.menu_order)
    
    pages_result = await db.execute(pages_query)
    pages = pages_result.scalars().all()
    
    # Obține categoriile de anunțuri
    ann_categories_query = select(AnnouncementCategory).where(
        AnnouncementCategory.is_active == True
    )
    ann_categories_result = await db.execute(ann_categories_query)
    announcement_categories = ann_categories_result.scalars().all()
    
    sitemap = {
        "static_pages": [
            {"title": "Pagina Principală", "url": "/", "priority": 1.0},
            {"title": "Contact", "url": "/contact", "priority": 0.8},
            {"title": "Harta Site", "url": "/harta-site", "priority": 0.5}
        ],
        "content_pages": [],
        "services": [
            {"title": "Programări Online", "url": "/programari-online", "priority": 0.9},
            {"title": "Plăți Online", "url": "/plati-online", "priority": 0.9},
            {"title": "Formulare Online", "url": "/servicii-publice/formulare", "priority": 0.8},
            {"title": "Căutare Programări", "url": "/verificare-programare", "priority": 0.7}
        ],
        "announcements": [
            {"title": "Toate Anunțurile", "url": "/anunturi", "priority": 0.8}
        ],
        "legal_pages": [
            {"title": "Termeni și Condiții", "url": "/termeni-conditii", "priority": 0.3},
            {"title": "Politica de Confidențialitate", "url": "/politica-confidentialitate", "priority": 0.3},
            {"title": "GDPR", "url": "/gdpr", "priority": 0.3},
            {"title": "Accesibilitate", "url": "/accesibilitate", "priority": 0.3}
        ]
    }
    
    # Adăugare pagini de conținut
    for page in pages:
        sitemap["content_pages"].append({
            "title": page.title,
            "url": f"/pagina/{page.slug}",
            "category": page.category.name if page.category else None,
            "priority": 0.7,
            "last_modified": page.updated_at.isoformat() if page.updated_at else None
        })
    
    # Adăugare categorii de anunțuri
    for category in announcement_categories:
        sitemap["announcements"].append({
            "title": f"Anunțuri - {category.name}",
            "url": f"/anunturi?categoria={category.slug}",
            "priority": 0.6
        })
    
    return sitemap