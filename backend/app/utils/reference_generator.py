"""
Generator pentru numere de referință unice
"""
import random
import string
from datetime import datetime
from typing import Optional


def generate_reference_number(prefix: str = "REF", length: int = 8) -> str:
    """
    Generează un număr de referință unic pentru cereri și sesizări
    
    Args:
        prefix: Prefixul pentru numărul de referință (ex: "CERERE", "SESIZARE")
        length: Lungimea părții aleatoare
    
    Returns:
        Numărul de referință în format: PREFIX-YYYYMMDD-XXXXXXXX
    """
    # Data curentă în format YYYYMMDD
    date_str = datetime.now().strftime("%Y%m%d")
    
    # Generează partea aleatoare
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    
    # Construiește numărul de referință
    reference = f"{prefix}-{date_str}-{random_part}"
    
    return reference


def generate_form_reference(form_type_slug: str) -> str:
    """
    Generează număr de referință specific pentru un tip de formular
    
    Args:
        form_type_slug: Slug-ul tipului de formular
    
    Returns:
        Numărul de referință
    """
    # Convertește slug-ul în prefix mai scurt
    prefix_map = {
        'certificat-urbanism': 'CU',
        'autorizatie-constructie': 'AC',
        'certificat-fiscal': 'CF',
        'declaratie-impozit': 'DI',
        'adeverinta-domiciliu': 'AD',
        'cerere-racordare': 'CR',
        'licenta-functionare': 'LF',
        'autorizatie-demolare': 'AD',
        'certificat-atestare': 'CA',
        'solicitare-informatii': 'SI'
    }
    
    prefix = prefix_map.get(form_type_slug, 'FORM')
    return generate_reference_number(prefix, 6)


def generate_complaint_reference(category_slug: str) -> str:
    """
    Generează număr de referință specific pentru o categorie de sesizare
    
    Args:
        category_slug: Slug-ul categoriei de sesizare
    
    Returns:
        Numărul de referință
    """
    # Convertește slug-ul în prefix mai scurt
    prefix_map = {
        'drumuri-transport': 'DT',
        'iluminat-public': 'IP',
        'salubritate': 'SAL',
        'spatii-verzi': 'SV',
        'ordine-publica': 'OP',
        'infrastructura': 'INF',
        'servicii-publice': 'SP',
        'mediu': 'MED',
        'animale-vagabonde': 'AV',
        'probleme-administrative': 'PA'
    }
    
    prefix = prefix_map.get(category_slug, 'SEZ')
    return generate_reference_number(prefix, 6)


def validate_reference_format(reference: str) -> bool:
    """
    Validează formatul unui număr de referință
    
    Args:
        reference: Numărul de referință de validat
    
    Returns:
        True dacă formatul este valid, False altfel
    """
    try:
        parts = reference.split('-')
        if len(parts) != 3:
            return False
        
        prefix, date_part, random_part = parts
        
        # Verifică prefixul (doar litere)
        if not prefix.isalpha():
            return False
        
        # Verifică data (8 cifre)
        if not date_part.isdigit() or len(date_part) != 8:
            return False
        
        # Verifică partea aleatoare (litere mari și cifre)
        if not random_part.isalnum() or not random_part.isupper():
            return False
        
        # Verifică că data este validă
        datetime.strptime(date_part, "%Y%m%d")
        
        return True
        
    except (ValueError, AttributeError):
        return False


def extract_date_from_reference(reference: str) -> Optional[datetime]:
    """
    Extrage data din numărul de referință
    
    Args:
        reference: Numărul de referință
    
    Returns:
        Obiectul datetime sau None dacă nu se poate extrage
    """
    try:
        parts = reference.split('-')
        if len(parts) != 3:
            return None
        
        date_part = parts[1]
        return datetime.strptime(date_part, "%Y%m%d")
        
    except (ValueError, AttributeError):
        return None


def extract_prefix_from_reference(reference: str) -> Optional[str]:
    """
    Extrage prefixul din numărul de referință
    
    Args:
        reference: Numărul de referință
    
    Returns:
        Prefixul sau None dacă nu se poate extrage
    """
    try:
        parts = reference.split('-')
        if len(parts) != 3:
            return None
        
        return parts[0]
        
    except (ValueError, AttributeError):
        return None


# Exemple de utilizare pentru testare
if __name__ == "__main__":
    # Testează generarea numerelor de referință
    print("Numere de referință generate:")
    print(f"Cerere generală: {generate_reference_number('CERERE')}")
    print(f"Sesizare generală: {generate_reference_number('SESIZARE')}")
    print(f"Certificat urbanism: {generate_form_reference('certificat-urbanism')}")
    print(f"Sesizare drumuri: {generate_complaint_reference('drumuri-transport')}")
    
    # Testează validarea
    valid_ref = generate_reference_number("TEST")
    print(f"\nTestare validare:")
    print(f"Referință: {valid_ref}")
    print(f"Valid: {validate_reference_format(valid_ref)}")
    print(f"Data: {extract_date_from_reference(valid_ref)}")
    print(f"Prefix: {extract_prefix_from_reference(valid_ref)}")
    
    # Testează format invalid
    invalid_ref = "INVALID-FORMAT"
    print(f"\nReferință invalidă: {invalid_ref}")
    print(f"Valid: {validate_reference_format(invalid_ref)}")