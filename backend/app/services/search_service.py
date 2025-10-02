"""
Service pentru indexarea și căutarea conținutului
"""
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func, or_, and_
from sqlalchemy.orm import selectinload

from ..models.content import Page, Announcement, ContentCategory, AnnouncementCategory
from ..models.documents import SearchIndex
from ..models.forms import FormSubmission
from ..models.appointments import Appointment
from ..models.documents import MOLDocument


class SearchService:
    """Service pentru gestionarea căutării și indexării"""
    
    @staticmethod
    async def index_all_content(db: AsyncSession):
        """Indexează tot conținutul în search_index"""
        
        # Șterge indexul existent
        await db.execute(text("DELETE FROM search_index"))
        
        # Indexează pages
        pages_query = select(Page).options(
            selectinload(Page.category)
        ).where(Page.status == 'published')
        
        pages_result = await db.execute(pages_query)
        pages = pages_result.scalars().all()
        
        for page in pages:
            search_entry = SearchIndex(
                content_type='page',
                content_id=str(page.id),
                title=page.title,
                content_text=f"{page.title} {page.content or ''} {page.excerpt or ''}",
                url=f"/pagina/{page.slug}",
                category=page.category.name if page.category else None,
                tags=[],
                search_vector=None  # va fi setat de trigger-ul PostgreSQL
            )
            db.add(search_entry)
        
        # Indexează announcements
        announcements_query = select(Announcement).options(
            selectinload(Announcement.category)
        ).where(Announcement.status == 'published')
        
        announcements_result = await db.execute(announcements_query)
        announcements = announcements_result.scalars().all()
        
        for announcement in announcements:
            search_entry = SearchIndex(
                content_type='announcement',
                content_id=str(announcement.id),
                title=announcement.title,
                content_text=f"{announcement.title} {announcement.content} {announcement.excerpt or ''}",
                url=f"/anunturi/{announcement.slug}",
                category=announcement.category.name if announcement.category else None,
                tags=announcement.tags or [],
                search_vector=None  # va fi setat de trigger-ul PostgreSQL
            )
            db.add(search_entry)
        
        # Indexează form submissions (doar pentru admin)
        forms_query = select(FormSubmission).options(
            selectinload(FormSubmission.form_type)
        ).limit(100)  # Limităm pentru performance
        forms_result = await db.execute(forms_query)
        forms = forms_result.scalars().all()
        
        for form in forms:
            search_entry = SearchIndex(
                content_type='form_submission',
                content_id=str(form.id),  # UUID ca string
                title=f"Cerere {form.reference_number}",
                content_text=f"{form.citizen_name} {form.reference_number} {form.status} {form.form_type.name if form.form_type else ''}",
                url=f"/admin/forms/{form.id}",
                category="Formulare",
                tags=[],
                search_vector=None  # va fi setat de trigger-ul PostgreSQL
            )
            db.add(search_entry)
        
        # Indexează appointments (doar pentru admin)
        appointments_query = select(Appointment).options(
            selectinload(Appointment.category)
        ).limit(100)
        appointments_result = await db.execute(appointments_query)
        appointments = appointments_result.scalars().all()
        
        for appointment in appointments:
            search_entry = SearchIndex(
                content_type='appointment',
                content_id=str(appointment.id),  # UUID ca string
                title=f"Programare {appointment.reference_number}",
                content_text=f"{appointment.citizen_name} {appointment.subject} {appointment.reference_number}",
                url=f"/admin/appointments/{appointment.id}",
                category=appointment.category.name if appointment.category else "Programări",
                tags=[],
                search_vector=None  # va fi setat de trigger-ul PostgreSQL
            )
            db.add(search_entry)
        
        # Indexează documentele MOL (publice)
        mol_query = select(MOLDocument).options(
            selectinload(MOLDocument.category)
        ).where(
            MOLDocument.status == 'published',
            MOLDocument.is_public == True
        ).limit(100)
        mol_result = await db.execute(mol_query)
        mol_documents = mol_result.scalars().all()
        
        for mol_doc in mol_documents:
            search_entry = SearchIndex(
                content_type='mol_document',
                content_id=str(mol_doc.id),
                title=mol_doc.title,
                content_text=f"{mol_doc.title} {mol_doc.content or ''} {mol_doc.document_number or ''} {mol_doc.description or ''}",
                url=f"/mol/document/{mol_doc.id}",
                category=mol_doc.category.name if mol_doc.category else "MOL",
                tags=[],
                search_vector=None  # va fi setat de trigger-ul PostgreSQL
            )
            db.add(search_entry)
        
        await db.commit()
    
    @staticmethod
    async def search_content(
        db: AsyncSession,
        query: str,
        content_types: Optional[List[str]] = None,
        category: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Efectuează căutarea în conținut"""
        
        if not query or len(query.strip()) < 2:
            return {
                "results": [],
                "total": 0,
                "query": query,
                "suggestions": []
            }
        
        # Pregătește query-ul pentru căutare full-text
        search_query = query.strip()
        
        # Construire query SQL pentru căutare
        base_query = select(SearchIndex)
        conditions = []
        
        # Căutare full-text cu PostgreSQL
        if len(search_query) >= 3:
            # Căutare cu tsvector pentru română
            ts_query = func.plainto_tsquery('romanian', search_query)
            conditions.append(SearchIndex.search_vector.op('@@')(ts_query))
        else:
            # Căutare simplă cu LIKE pentru query-uri scurte
            like_pattern = f"%{search_query}%"
            conditions.append(
                or_(
                    SearchIndex.title.ilike(like_pattern),
                    SearchIndex.content_text.ilike(like_pattern)
                )
            )
        
        # Filtrare după tip conținut
        if content_types:
            conditions.append(SearchIndex.content_type.in_(content_types))
        
        # Filtrare după categorie
        if category:
            conditions.append(SearchIndex.category.ilike(f"%{category}%"))
        
        # Aplicare filtre
        if conditions:
            base_query = base_query.where(and_(*conditions))
        
        # Query pentru total
        count_query = select(func.count(SearchIndex.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        
        # Execuție queries
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Query cu ranking pentru căutare full-text
        if len(search_query) >= 3:
            ts_query = func.plainto_tsquery('romanian', search_query)
            results_query = select(
                SearchIndex,
                func.ts_rank(SearchIndex.search_vector, ts_query).label('rank')
            ).where(and_(*conditions)).order_by(
                func.ts_rank(SearchIndex.search_vector, ts_query).desc()
            ).limit(limit).offset(offset)
        else:
            results_query = base_query.order_by(
                SearchIndex.title
            ).limit(limit).offset(offset)
        
        results_data = await db.execute(results_query)
        
        if len(search_query) >= 3:
            results = [row[0] for row in results_data.fetchall()]  # row[0] = SearchIndex, row[1] = rank
        else:
            results = results_data.scalars().all()
        
        # Formatare rezultate pentru frontend
        formatted_results = []
        for result in results:
            # Highlight query în title și excerpt
            highlighted_title = SearchService._highlight_text(result.title, search_query)
            highlighted_excerpt = SearchService._create_excerpt(result.content_text, search_query)
            
            formatted_results.append({
                "id": result.id,
                "content_type": result.content_type,
                "content_id": result.content_id,
                "title": highlighted_title,
                "excerpt": highlighted_excerpt,
                "url": result.url,
                "category": result.category,
                "tags": result.tags or [],
                "last_indexed": result.last_indexed.isoformat() if result.last_indexed else None
            })
        
        # Sugestii pentru correții
        suggestions = []
        if total == 0 and len(search_query) > 3:
            suggestions = await SearchService._get_search_suggestions(db, search_query)
        
        return {
            "results": formatted_results,
            "total": total,
            "query": search_query,
            "limit": limit,
            "offset": offset,
            "suggestions": suggestions
        }
    
    @staticmethod
    def _highlight_text(text: str, query: str, max_length: int = 200) -> str:
        """Adaugă highlighting pentru termenul căutat"""
        if not query or not text:
            return text[:max_length] + "..." if len(text) > max_length else text
        
        # Escape pentru regex
        escaped_query = re.escape(query)
        pattern = re.compile(f"({escaped_query})", re.IGNORECASE)
        
        highlighted = pattern.sub(r'<mark>\1</mark>', text)
        
        if len(highlighted) > max_length:
            # Găsește poziția primului highlight
            mark_pos = highlighted.lower().find('<mark>')
            if mark_pos > 100:
                start = max(0, mark_pos - 50)
                highlighted = "..." + highlighted[start:start + max_length]
            else:
                highlighted = highlighted[:max_length] + "..."
        
        return highlighted
    
    @staticmethod
    def _create_excerpt(content: str, query: str, max_length: int = 300) -> str:
        """Creează un excerpt cu highlighting în jurul termenului căutat"""
        if not query or not content:
            return content[:max_length] + "..." if len(content) > max_length else content
        
        # Găsește poziția termenului în text
        query_lower = query.lower()
        content_lower = content.lower()
        pos = content_lower.find(query_lower)
        
        if pos == -1:
            return content[:max_length] + "..." if len(content) > max_length else content
        
        # Calculează start și end pentru excerpt
        start = max(0, pos - 100)
        end = min(len(content), pos + len(query) + 100)
        
        excerpt = content[start:end]
        
        # Adaugă "..." la început și sfârșit dacă e necesar
        if start > 0:
            excerpt = "..." + excerpt
        if end < len(content):
            excerpt = excerpt + "..."
        
        # Adaugă highlighting
        return SearchService._highlight_text(excerpt, query, max_length)
    
    @staticmethod
    async def _get_search_suggestions(db: AsyncSession, query: str) -> List[str]:
        """Generează sugestii pentru correții ortografice"""
        
        # Query pentru termeni similari din index
        similar_query = text("""
            SELECT DISTINCT title
            FROM search_index 
            WHERE similarity(title, :query) > 0.3
            ORDER BY similarity(title, :query) DESC
            LIMIT 5
        """)
        
        try:
            result = await db.execute(similar_query, {"query": query})
            suggestions = [row[0] for row in result.fetchall()]
            return suggestions
        except Exception:
            # Fallback la sugestii simple dacă extensia pg_trgm nu e disponibilă
            words = query.split()
            if len(words) > 1:
                return [" ".join(words[:-1])]  # Înlătură ultimul cuvânt
            return []
    
    @staticmethod
    async def get_popular_searches(db: AsyncSession, limit: int = 10) -> List[Dict[str, Any]]:
        """Obține căutările populare (pentru autocomplete)"""
        
        # În implementarea completă, aici am avea o tabelă search_logs
        # Pentru moment, returnăm termeni comuni din content
        
        popular_terms_query = text("""
            WITH word_list AS (
                SELECT unnest(string_to_array(lower(title), ' ')) as word
                FROM search_index 
                WHERE content_type IN ('page', 'announcement')
            )
            SELECT word as term, COUNT(*) as frequency
            FROM word_list 
            WHERE LENGTH(word) > 3
            GROUP BY word
            ORDER BY frequency DESC
            LIMIT :limit
        """)
        
        result = await db.execute(popular_terms_query, {"limit": limit})
        terms = [{"term": row[0], "frequency": row[1]} for row in result.fetchall()]
        
        return terms
    
    @staticmethod
    async def index_single_content(
        db: AsyncSession,
        content_type: str,
        content_id: int,
        title: str,
        content_text: str,
        url: str,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None
    ):
        """Indexează un singur element de conținut"""
        
        # Șterge intrarea existentă
        await db.execute(
            text("DELETE FROM search_index WHERE content_type = :type AND content_id = :id"),
            {"type": content_type, "id": str(content_id)}
        )
        
        # Adaugă intrarea nouă
        search_entry = SearchIndex(
            content_type=content_type,
            content_id=str(content_id),
            title=title,
            content_text=content_text,
            url=url,
            category=category,
            tags=tags or [],
            search_vector=None  # va fi setat de trigger-ul PostgreSQL
        )
        db.add(search_entry)
        await db.commit()