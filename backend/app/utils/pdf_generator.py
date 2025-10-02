"""
Generator de PDF-uri pentru documentele oficiale ale primăriei
"""
import os
import io
from datetime import datetime, date
from typing import Dict, Any, Optional
from pathlib import Path

# Pentru development, vom folosi o implementare simplificată fără dependențe
# În producție, se vor folosi reportlab sau weasyprint pentru PDF-uri profesionale

def create_mock_pdf_content(document_type: str, data: Dict[str, Any], municipality_config: Dict[str, Any]) -> bytes:
    """
    Creează conținutul unui PDF mock pentru demonstrație
    În producție, acesta va fi înlocuit cu generare reală de PDF
    """
    
    # Template HTML pentru PDF
    html_content = generate_html_template(document_type, data, municipality_config)
    
    # Pentru moment, returnăm conținutul HTML ca bytes
    # În producție, acesta va fi convertit în PDF real
    return html_content.encode('utf-8')


def generate_html_template(document_type: str, data: Dict[str, Any], municipality_config: Dict[str, Any]) -> str:
    """
    Generează template-ul HTML pentru documentul oficial
    """
    
    templates = {
        'certificat-urbanism': generate_urbanism_certificate_html,
        'certificat-fiscal': generate_fiscal_certificate_html,
        'adeverinta-domiciliu': generate_residence_certificate_html,
        'autorizatie-constructie': generate_construction_permit_html,
        'licenta-functionare': generate_operating_license_html,
        'cerere-racordare': generate_utility_connection_html
    }
    
    generator = templates.get(document_type, generate_generic_document_html)
    return generator(data, municipality_config)


def generate_urbanism_certificate_html(data: Dict[str, Any], municipality_config: Dict[str, Any]) -> str:
    """Generează certificatul de urbanism"""
    current_date = datetime.now().strftime('%d.%m.%Y')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Certificat de Urbanism</title>
        <style>
            body {{ 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                line-height: 1.6;
                color: #000;
            }}
            .header {{ 
                text-align: center; 
                border-bottom: 3px solid #004990; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
            }}
            .logo {{ 
                width: 80px; 
                height: 80px; 
                margin-bottom: 10px;
            }}
            .municipality-name {{ 
                font-size: 18px; 
                font-weight: bold; 
                color: #004990; 
                margin-bottom: 5px;
            }}
            .document-title {{ 
                font-size: 24px; 
                font-weight: bold; 
                text-transform: uppercase; 
                margin: 30px 0; 
                text-align: center;
                color: #004990;
            }}
            .reference-number {{ 
                text-align: right; 
                font-weight: bold; 
                margin-bottom: 20px;
            }}
            .content {{ 
                text-align: justify; 
                margin: 20px 0;
                font-size: 14px;
            }}
            .data-table {{ 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
            }}
            .data-table td {{ 
                padding: 8px; 
                border: 1px solid #ccc;
            }}
            .data-table .label {{ 
                background-color: #f5f5f5; 
                font-weight: bold; 
                width: 40%;
            }}
            .signature-section {{ 
                margin-top: 50px; 
                display: flex; 
                justify-content: space-between;
            }}
            .signature-box {{ 
                text-align: center; 
                width: 45%;
            }}
            .stamp-area {{ 
                margin-top: 40px; 
                text-align: center;
                border: 2px dashed #004990;
                padding: 30px;
                color: #666;
            }}
            .footer {{ 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="municipality-name">{municipality_config.get('official_name', 'PRIMĂRIA COMUNEI')}</div>
            <div style="font-size: 14px;">{municipality_config.get('address', 'Adresa primăriei')}</div>
            <div style="font-size: 14px;">Tel: {municipality_config.get('contact_phone', '0256 123 456')} | Email: {municipality_config.get('contact_email', 'contact@primarie.ro')}</div>
        </div>
        
        <div class="reference-number">
            Nr. {data.get('reference_number', 'CU-XXXX-XXXX')}<br>
            Data: {current_date}
        </div>
        
        <div class="document-title">CERTIFICAT DE URBANISM</div>
        
        <div class="content">
            <p>Prin prezentul certificat se atestă că pentru imobilul situat în:</p>
            
            <table class="data-table">
                <tr>
                    <td class="label">Solicitant:</td>
                    <td>{data.get('citizen_name', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Adresa proprietății:</td>
                    <td>{data.get('submission_data', {}).get('property_address', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Nr. cadastral:</td>
                    <td>{data.get('submission_data', {}).get('property_cadastral', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Suprafața terenului:</td>
                    <td>{data.get('submission_data', {}).get('property_area', 'N/A')} mp</td>
                </tr>
                <tr>
                    <td class="label">Tipul construcției:</td>
                    <td>{data.get('submission_data', {}).get('construction_type', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Suprafața construită:</td>
                    <td>{data.get('submission_data', {}).get('building_area', 'N/A')} mp</td>
                </tr>
            </table>
            
            <p><strong>SE POATE EXECUTA</strong> construcția solicită, cu respectarea următoarelor condiții:</p>
            
            <ul>
                <li>Respectarea prevederilor Planului Urbanistic General în vigoare</li>
                <li>Respectarea normelor tehnice de construcție în vigoare</li>
                <li>Respectarea distanțelor față de limitele de proprietate</li>
                <li>Obținerea tuturor avizelor necesare conform legislației</li>
                <li>Depunerea proiectului tehnic pentru obținerea autorizației de construcție</li>
            </ul>
            
            <p>Prezentul certificat este valabil <strong>24 de luni</strong> de la data emiterii.</p>
        </div>
        
        <div class="signature-section">
            <div class="signature-box">
                <div style="margin-bottom: 50px;">PRIMAR</div>
                <div style="border-top: 1px solid #000; padding-top: 5px;">
                    {municipality_config.get('mayor_name', 'Numele Primarului')}
                </div>
            </div>
            <div class="signature-box">
                <div style="margin-bottom: 50px;">ARHITECT ȘEF</div>
                <div style="border-top: 1px solid #000; padding-top: 5px;">
                    Arhitect Șef
                </div>
            </div>
        </div>
        
        <div class="stamp-area">
            [ȘTAMPILA PRIMĂRIEI]
        </div>
        
        <div class="footer">
            Document generat electronic în data {current_date}<br>
            Verifică autenticitatea la: {municipality_config.get('website_url', 'www.primarie.ro')}/verificare/{data.get('reference_number', 'XXX')}
        </div>
    </body>
    </html>
    """


def generate_fiscal_certificate_html(data: Dict[str, Any], municipality_config: Dict[str, Any]) -> str:
    """Generează certificatul fiscal"""
    current_date = datetime.now().strftime('%d.%m.%Y')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Certificat Fiscal</title>
        <style>
            body {{ 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                line-height: 1.6;
                color: #000;
            }}
            .header {{ 
                text-align: center; 
                border-bottom: 3px solid #004990; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
            }}
            .municipality-name {{ 
                font-size: 18px; 
                font-weight: bold; 
                color: #004990; 
                margin-bottom: 5px;
            }}
            .document-title {{ 
                font-size: 24px; 
                font-weight: bold; 
                text-transform: uppercase; 
                margin: 30px 0; 
                text-align: center;
                color: #004990;
            }}
            .reference-number {{ 
                text-align: right; 
                font-weight: bold; 
                margin-bottom: 20px;
            }}
            .content {{ 
                text-align: justify; 
                margin: 20px 0;
                font-size: 14px;
            }}
            .data-table {{ 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
            }}
            .data-table td {{ 
                padding: 8px; 
                border: 1px solid #ccc;
            }}
            .data-table .label {{ 
                background-color: #f5f5f5; 
                font-weight: bold; 
                width: 40%;
            }}
            .signature-section {{ 
                margin-top: 50px; 
                text-align: right;
            }}
            .stamp-area {{ 
                margin-top: 40px; 
                text-align: center;
                border: 2px dashed #004990;
                padding: 30px;
                color: #666;
            }}
            .footer {{ 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="municipality-name">{municipality_config.get('official_name', 'PRIMĂRIA COMUNEI')}</div>
            <div style="font-size: 14px;">{municipality_config.get('address', 'Adresa primăriei')}</div>
            <div style="font-size: 14px;">Tel: {municipality_config.get('contact_phone', '0256 123 456')} | Email: {municipality_config.get('contact_email', 'contact@primarie.ro')}</div>
        </div>
        
        <div class="reference-number">
            Nr. {data.get('reference_number', 'CF-XXXX-XXXX')}<br>
            Data: {current_date}
        </div>
        
        <div class="document-title">CERTIFICAT FISCAL</div>
        
        <div class="content">
            <p>Se certifică că:</p>
            
            <table class="data-table">
                <tr>
                    <td class="label">Numele și prenumele/Denumirea:</td>
                    <td>{data.get('citizen_name', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">CNP/CUI:</td>
                    <td>{data.get('citizen_cnp', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Adresa:</td>
                    <td>{data.get('citizen_address', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Scopul certificatului:</td>
                    <td>{data.get('submission_data', {}).get('certificate_purpose', 'N/A')}</td>
                </tr>
            </table>
            
            <p style="text-align: center; font-weight: bold; font-size: 16px; margin: 30px 0; padding: 20px; border: 2px solid #004990;">
                NU ARE DATORII LA BUGETUL LOCAL
            </p>
            
            <p>La data emiterii prezentului certificat, persoana menționată mai sus <strong>NU ÎNREGISTREAZĂ DATORII</strong> către bugetul local al {municipality_config.get('name', 'comunei')} pentru:</p>
            
            <ul>
                <li>Impozitul pe clădiri</li>
                <li>Impozitul pe teren</li>
                <li>Taxa pentru salubrizare</li>
                <li>Alte taxe locale</li>
            </ul>
            
            <p>Prezentul certificat este valabil <strong>30 de zile</strong> de la data emiterii și se eliberează pentru folosirea la: {data.get('submission_data', {}).get('certificate_purpose', 'scopul menționat')}.</p>
        </div>
        
        <div class="signature-section">
            <div style="display: inline-block; text-align: center;">
                <div style="margin-bottom: 50px;">PRIMAR</div>
                <div style="border-top: 1px solid #000; padding-top: 5px; width: 200px;">
                    {municipality_config.get('mayor_name', 'Numele Primarului')}
                </div>
            </div>
        </div>
        
        <div class="stamp-area">
            [ȘTAMPILA PRIMĂRIEI]
        </div>
        
        <div class="footer">
            Document generat electronic în data {current_date}<br>
            Verifică autenticitatea la: {municipality_config.get('website_url', 'www.primarie.ro')}/verificare/{data.get('reference_number', 'XXX')}
        </div>
    </body>
    </html>
    """


def generate_residence_certificate_html(data: Dict[str, Any], municipality_config: Dict[str, Any]) -> str:
    """Generează adeverința de domiciliu"""
    current_date = datetime.now().strftime('%d.%m.%Y')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Adeverință de Domiciliu</title>
        <style>
            body {{ 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                line-height: 1.6;
                color: #000;
            }}
            .header {{ 
                text-align: center; 
                border-bottom: 3px solid #004990; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
            }}
            .municipality-name {{ 
                font-size: 18px; 
                font-weight: bold; 
                color: #004990; 
                margin-bottom: 5px;
            }}
            .document-title {{ 
                font-size: 24px; 
                font-weight: bold; 
                text-transform: uppercase; 
                margin: 30px 0; 
                text-align: center;
                color: #004990;
            }}
            .reference-number {{ 
                text-align: right; 
                font-weight: bold; 
                margin-bottom: 20px;
            }}
            .content {{ 
                text-align: justify; 
                margin: 20px 0;
                font-size: 14px;
            }}
            .data-table {{ 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
            }}
            .data-table td {{ 
                padding: 8px; 
                border: 1px solid #ccc;
            }}
            .data-table .label {{ 
                background-color: #f5f5f5; 
                font-weight: bold; 
                width: 40%;
            }}
            .signature-section {{ 
                margin-top: 50px; 
                text-align: right;
            }}
            .stamp-area {{ 
                margin-top: 40px; 
                text-align: center;
                border: 2px dashed #004990;
                padding: 30px;
                color: #666;
            }}
            .footer {{ 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="municipality-name">{municipality_config.get('official_name', 'PRIMĂRIA COMUNEI')}</div>
            <div style="font-size: 14px;">{municipality_config.get('address', 'Adresa primăriei')}</div>
            <div style="font-size: 14px;">Tel: {municipality_config.get('contact_phone', '0256 123 456')} | Email: {municipality_config.get('contact_email', 'contact@primarie.ro')}</div>
        </div>
        
        <div class="reference-number">
            Nr. {data.get('reference_number', 'AD-XXXX-XXXX')}<br>
            Data: {current_date}
        </div>
        
        <div class="document-title">ADEVERINȚĂ DE DOMICILIU</div>
        
        <div class="content">
            <p>Se adeverește că:</p>
            
            <table class="data-table">
                <tr>
                    <td class="label">Numele și prenumele:</td>
                    <td>{data.get('citizen_name', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">CNP:</td>
                    <td>{data.get('citizen_cnp', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Are domiciliul/reședința la:</td>
                    <td>{data.get('submission_data', {}).get('address', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Tipul reședinței:</td>
                    <td>{data.get('submission_data', {}).get('residence_type', 'N/A').title()}</td>
                </tr>
                <tr>
                    <td class="label">Locuiește de la data:</td>
                    <td>{data.get('submission_data', {}).get('residence_since', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Scopul adeverinței:</td>
                    <td>{data.get('submission_data', {}).get('purpose', 'N/A')}</td>
                </tr>
            </table>
            
            <p>Adresa menționată se află în raza administrativă a {municipality_config.get('name', 'comunei')}.</p>
            
            <p>Prezenta adeverință se eliberează la cererea persoanei interesate pentru folosirea la: <strong>{data.get('submission_data', {}).get('purpose', 'scopul menționat')}</strong>.</p>
            
            <p>Adeverința este valabilă <strong>6 luni</strong> de la data emiterii.</p>
        </div>
        
        <div class="signature-section">
            <div style="display: inline-block; text-align: center;">
                <div style="margin-bottom: 50px;">PRIMAR</div>
                <div style="border-top: 1px solid #000; padding-top: 5px; width: 200px;">
                    {municipality_config.get('mayor_name', 'Numele Primarului')}
                </div>
            </div>
        </div>
        
        <div class="stamp-area">
            [ȘTAMPILA PRIMĂRIEI]
        </div>
        
        <div class="footer">
            Document generat electronic în data {current_date}<br>
            Verifică autenticitatea la: {municipality_config.get('website_url', 'www.primarie.ro')}/verificare/{data.get('reference_number', 'XXX')}
        </div>
    </body>
    </html>
    """


def generate_construction_permit_html(data: Dict[str, Any], municipality_config: Dict[str, Any]) -> str:
    """Generează autorizația de construcție"""
    current_date = datetime.now().strftime('%d.%m.%Y')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Autorizație de Construcție</title>
        <style>
            body {{ 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                line-height: 1.6;
                color: #000;
            }}
            .header {{ 
                text-align: center; 
                border-bottom: 3px solid #004990; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
            }}
            .municipality-name {{ 
                font-size: 18px; 
                font-weight: bold; 
                color: #004990; 
                margin-bottom: 5px;
            }}
            .document-title {{ 
                font-size: 24px; 
                font-weight: bold; 
                text-transform: uppercase; 
                margin: 30px 0; 
                text-align: center;
                color: #004990;
            }}
            .reference-number {{ 
                text-align: right; 
                font-weight: bold; 
                margin-bottom: 20px;
            }}
            .content {{ 
                text-align: justify; 
                margin: 20px 0;
                font-size: 14px;
            }}
            .data-table {{ 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
            }}
            .data-table td {{ 
                padding: 8px; 
                border: 1px solid #ccc;
            }}
            .data-table .label {{ 
                background-color: #f5f5f5; 
                font-weight: bold; 
                width: 40%;
            }}
            .signature-section {{ 
                margin-top: 50px; 
                display: flex; 
                justify-content: space-between;
            }}
            .signature-box {{ 
                text-align: center; 
                width: 45%;
            }}
            .stamp-area {{ 
                margin-top: 40px; 
                text-align: center;
                border: 2px dashed #004990;
                padding: 30px;
                color: #666;
            }}
            .footer {{ 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="municipality-name">{municipality_config.get('official_name', 'PRIMĂRIA COMUNEI')}</div>
            <div style="font-size: 14px;">{municipality_config.get('address', 'Adresa primăriei')}</div>
            <div style="font-size: 14px;">Tel: {municipality_config.get('contact_phone', '0256 123 456')} | Email: {municipality_config.get('contact_email', 'contact@primarie.ro')}</div>
        </div>
        
        <div class="reference-number">
            Nr. {data.get('reference_number', 'AC-XXXX-XXXX')}<br>
            Data: {current_date}
        </div>
        
        <div class="document-title">AUTORIZAȚIE DE CONSTRUCȚIE</div>
        
        <div class="content">
            <p>Se autorizează execuția lucrărilor de construcții pentru:</p>
            
            <table class="data-table">
                <tr>
                    <td class="label">Beneficiar:</td>
                    <td>{data.get('citizen_name', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Certificat urbanism nr.:</td>
                    <td>{data.get('submission_data', {}).get('urbanism_certificate_number', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Tipul proiectului:</td>
                    <td>{data.get('submission_data', {}).get('project_type', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Valoarea investiției:</td>
                    <td>{data.get('submission_data', {}).get('total_investment', 'N/A')} lei</td>
                </tr>
                <tr>
                    <td class="label">Arhitect responsabil:</td>
                    <td>{data.get('submission_data', {}).get('architect_name', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Constructor:</td>
                    <td>{data.get('submission_data', {}).get('contractor_name', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Data începerii lucrărilor:</td>
                    <td>{data.get('submission_data', {}).get('construction_start_date', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Durata estimată:</td>
                    <td>{data.get('submission_data', {}).get('construction_duration', 'N/A')} luni</td>
                </tr>
            </table>
            
            <p><strong>CONDIȚII DE EXECUȚIE:</strong></p>
            
            <ul>
                <li>Lucrările se vor executa conform proiectului tehnic autorizat</li>
                <li>Se vor respecta toate avizele obținute</li>
                <li>Execuția se va face sub supravegherea tehnică a proiectantului</li>
                <li>Se va anunța începerea lucrărilor cu 5 zile înainte</li>
                <li>Se va solicita recepția la terminarea lucrărilor</li>
                <li>Se va obține autorizația de funcționare înainte de folosire</li>
            </ul>
            
            <p>Prezenta autorizație este valabilă <strong>24 de luni</strong> de la data emiterii.</p>
        </div>
        
        <div class="signature-section">
            <div class="signature-box">
                <div style="margin-bottom: 50px;">PRIMAR</div>
                <div style="border-top: 1px solid #000; padding-top: 5px;">
                    {municipality_config.get('mayor_name', 'Numele Primarului')}
                </div>
            </div>
            <div class="signature-box">
                <div style="margin-bottom: 50px;">ARHITECT ȘEF</div>
                <div style="border-top: 1px solid #000; padding-top: 5px;">
                    Arhitect Șef
                </div>
            </div>
        </div>
        
        <div class="stamp-area">
            [ȘTAMPILA PRIMĂRIEI]
        </div>
        
        <div class="footer">
            Document generat electronic în data {current_date}<br>
            Verifică autenticitatea la: {municipality_config.get('website_url', 'www.primarie.ro')}/verificare/{data.get('reference_number', 'XXX')}
        </div>
    </body>
    </html>
    """


def generate_operating_license_html(data: Dict[str, Any], municipality_config: Dict[str, Any]) -> str:
    """Generează licența de funcționare"""
    current_date = datetime.now().strftime('%d.%m.%Y')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Licență de Funcționare</title>
        <style>
            body {{ 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                line-height: 1.6;
                color: #000;
            }}
            .header {{ 
                text-align: center; 
                border-bottom: 3px solid #004990; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
            }}
            .municipality-name {{ 
                font-size: 18px; 
                font-weight: bold; 
                color: #004990; 
                margin-bottom: 5px;
            }}
            .document-title {{ 
                font-size: 24px; 
                font-weight: bold; 
                text-transform: uppercase; 
                margin: 30px 0; 
                text-align: center;
                color: #004990;
            }}
            .reference-number {{ 
                text-align: right; 
                font-weight: bold; 
                margin-bottom: 20px;
            }}
            .content {{ 
                text-align: justify; 
                margin: 20px 0;
                font-size: 14px;
            }}
            .data-table {{ 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
            }}
            .data-table td {{ 
                padding: 8px; 
                border: 1px solid #ccc;
            }}
            .data-table .label {{ 
                background-color: #f5f5f5; 
                font-weight: bold; 
                width: 40%;
            }}
            .signature-section {{ 
                margin-top: 50px; 
                text-align: right;
            }}
            .stamp-area {{ 
                margin-top: 40px; 
                text-align: center;
                border: 2px dashed #004990;
                padding: 30px;
                color: #666;
            }}
            .footer {{ 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="municipality-name">{municipality_config.get('official_name', 'PRIMĂRIA COMUNEI')}</div>
            <div style="font-size: 14px;">{municipality_config.get('address', 'Adresa primăriei')}</div>
            <div style="font-size: 14px;">Tel: {municipality_config.get('contact_phone', '0256 123 456')} | Email: {municipality_config.get('contact_email', 'contact@primarie.ro')}</div>
        </div>
        
        <div class="reference-number">
            Nr. {data.get('reference_number', 'LF-XXXX-XXXX')}<br>
            Data: {current_date}
        </div>
        
        <div class="document-title">LICENȚĂ DE FUNCȚIONARE</div>
        
        <div class="content">
            <p>Se acordă licența de funcționare pentru:</p>
            
            <table class="data-table">
                <tr>
                    <td class="label">Denumirea firmei:</td>
                    <td>{data.get('submission_data', {}).get('business_name', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">CUI:</td>
                    <td>{data.get('submission_data', {}).get('cui', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Reprezentant legal:</td>
                    <td>{data.get('citizen_name', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Tipul activității:</td>
                    <td>{data.get('submission_data', {}).get('activity_type', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Cod CAEN:</td>
                    <td>{data.get('submission_data', {}).get('caen_code', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Adresa locației:</td>
                    <td>{data.get('submission_data', {}).get('business_address', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Suprafața spațiului:</td>
                    <td>{data.get('submission_data', {}).get('space_area', 'N/A')} mp</td>
                </tr>
                <tr>
                    <td class="label">Numărul de angajați:</td>
                    <td>{data.get('submission_data', {}).get('employees_number', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Data începerii activității:</td>
                    <td>{data.get('submission_data', {}).get('estimated_start_date', 'N/A')}</td>
                </tr>
            </table>
            
            <p><strong>CONDIȚII DE FUNCȚIONARE:</strong></p>
            
            <ul>
                <li>Respectarea strictă a tipului de activitate autorizată</li>
                <li>Menținerea condițiilor care au stat la baza acordării licenței</li>
                <li>Respectarea normelor de protecția muncii și a mediului</li>
                <li>Plata la timp a taxelor locale</li>
                <li>Anunțarea oricăror modificări în 30 de zile</li>
                <li>Permiterea controalelor autorităților competente</li>
            </ul>
            
            <p>Prezenta licență este valabilă <strong>5 ani</strong> de la data emiterii și poate fi reînnoită la cerere.</p>
            
            <p style="font-weight: bold; color: #d32f2f;">Încălcarea condițiilor poate duce la suspendarea sau retragerea licenței!</p>
        </div>
        
        <div class="signature-section">
            <div style="display: inline-block; text-align: center;">
                <div style="margin-bottom: 50px;">PRIMAR</div>
                <div style="border-top: 1px solid #000; padding-top: 5px; width: 200px;">
                    {municipality_config.get('mayor_name', 'Numele Primarului')}
                </div>
            </div>
        </div>
        
        <div class="stamp-area">
            [ȘTAMPILA PRIMĂRIEI]
        </div>
        
        <div class="footer">
            Document generat electronic în data {current_date}<br>
            Verifică autenticitatea la: {municipality_config.get('website_url', 'www.primarie.ro')}/verificare/{data.get('reference_number', 'XXX')}
        </div>
    </body>
    </html>
    """


def generate_utility_connection_html(data: Dict[str, Any], municipality_config: Dict[str, Any]) -> str:
    """Generează cererea de racordare utilități"""
    current_date = datetime.now().strftime('%d.%m.%Y')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Aprobare Racordare Utilități</title>
        <style>
            body {{ 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                line-height: 1.6;
                color: #000;
            }}
            .header {{ 
                text-align: center; 
                border-bottom: 3px solid #004990; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
            }}
            .municipality-name {{ 
                font-size: 18px; 
                font-weight: bold; 
                color: #004990; 
                margin-bottom: 5px;
            }}
            .document-title {{ 
                font-size: 24px; 
                font-weight: bold; 
                text-transform: uppercase; 
                margin: 30px 0; 
                text-align: center;
                color: #004990;
            }}
            .reference-number {{ 
                text-align: right; 
                font-weight: bold; 
                margin-bottom: 20px;
            }}
            .content {{ 
                text-align: justify; 
                margin: 20px 0;
                font-size: 14px;
            }}
            .data-table {{ 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
            }}
            .data-table td {{ 
                padding: 8px; 
                border: 1px solid #ccc;
            }}
            .data-table .label {{ 
                background-color: #f5f5f5; 
                font-weight: bold; 
                width: 40%;
            }}
            .signature-section {{ 
                margin-top: 50px; 
                text-align: right;
            }}
            .stamp-area {{ 
                margin-top: 40px; 
                text-align: center;
                border: 2px dashed #004990;
                padding: 30px;
                color: #666;
            }}
            .footer {{ 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="municipality-name">{municipality_config.get('official_name', 'PRIMĂRIA COMUNEI')}</div>
            <div style="font-size: 14px;">{municipality_config.get('address', 'Adresa primăriei')}</div>
            <div style="font-size: 14px;">Tel: {municipality_config.get('contact_phone', '0256 123 456')} | Email: {municipality_config.get('contact_email', 'contact@primarie.ro')}</div>
        </div>
        
        <div class="reference-number">
            Nr. {data.get('reference_number', 'CR-XXXX-XXXX')}<br>
            Data: {current_date}
        </div>
        
        <div class="document-title">APROBARE RACORDARE UTILITĂȚI</div>
        
        <div class="content">
            <p>Se aprobă racordarea la rețelele de utilități pentru:</p>
            
            <table class="data-table">
                <tr>
                    <td class="label">Solicitant:</td>
                    <td>{data.get('citizen_name', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Tipul utilității:</td>
                    <td>{data.get('submission_data', {}).get('utility_type', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Adresa proprietății:</td>
                    <td>{data.get('submission_data', {}).get('property_address', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Tipul proprietății:</td>
                    <td>{data.get('submission_data', {}).get('property_type', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Consumul estimat:</td>
                    <td>{data.get('submission_data', {}).get('estimated_consumption', 'N/A')} mc/lună</td>
                </tr>
                <tr>
                    <td class="label">Diametrul racordării:</td>
                    <td>{data.get('submission_data', {}).get('connection_diameter', 'N/A')}</td>
                </tr>
                <tr>
                    <td class="label">Autorizație construcție:</td>
                    <td>{data.get('submission_data', {}).get('construction_permit', 'N/A')}</td>
                </tr>
            </table>
            
            <p><strong>CONDIȚII DE RACORDARE:</strong></p>
            
            <ul>
                <li>Execuția lucrărilor se va face de către firma autorizată</li>
                <li>Se va respecta proiectul tehnic autorizat</li>
                <li>Lucrările se vor anunța cu 48 de ore înainte</li>
                <li>Se va solicita recepția tehnică la finalizare</li>
                <li>Se vor plăti toate taxele de racordare</li>
                <li>Se va asigura accesul pentru verificări ulterioare</li>
            </ul>
            
            <p><strong>URMĂTORII PAȘI:</strong></p>
            <ol>
                <li>Contactați furnizorul de utilități pentru încheierea contractului</li>
                <li>Depuneți proiectul tehnic de racordare</li>
                <li>Plătiți taxele de racordare</li>
                <li>Programați execuția lucrărilor</li>
                <li>Solicitați recepția finală</li>
            </ol>
            
            <p>Prezenta aprobare este valabilă <strong>12 luni</strong> de la data emiterii.</p>
        </div>
        
        <div class="signature-section">
            <div style="display: inline-block; text-align: center;">
                <div style="margin-bottom: 50px;">PRIMAR</div>
                <div style="border-top: 1px solid #000; padding-top: 5px; width: 200px;">
                    {municipality_config.get('mayor_name', 'Numele Primarului')}
                </div>
            </div>
        </div>
        
        <div class="stamp-area">
            [ȘTAMPILA PRIMĂRIEI]
        </div>
        
        <div class="footer">
            Document generat electronic în data {current_date}<br>
            Verifică autenticitatea la: {municipality_config.get('website_url', 'www.primarie.ro')}/verificare/{data.get('reference_number', 'XXX')}
        </div>
    </body>
    </html>
    """


def generate_generic_document_html(data: Dict[str, Any], municipality_config: Dict[str, Any]) -> str:
    """Generează un document generic"""
    current_date = datetime.now().strftime('%d.%m.%Y')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Document Oficial</title>
        <style>
            body {{ 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                line-height: 1.6;
                color: #000;
            }}
            .header {{ 
                text-align: center; 
                border-bottom: 3px solid #004990; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
            }}
            .municipality-name {{ 
                font-size: 18px; 
                font-weight: bold; 
                color: #004990; 
                margin-bottom: 5px;
            }}
            .document-title {{ 
                font-size: 24px; 
                font-weight: bold; 
                text-transform: uppercase; 
                margin: 30px 0; 
                text-align: center;
                color: #004990;
            }}
            .reference-number {{ 
                text-align: right; 
                font-weight: bold; 
                margin-bottom: 20px;
            }}
            .content {{ 
                text-align: justify; 
                margin: 20px 0;
                font-size: 14px;
            }}
            .signature-section {{ 
                margin-top: 50px; 
                text-align: right;
            }}
            .stamp-area {{ 
                margin-top: 40px; 
                text-align: center;
                border: 2px dashed #004990;
                padding: 30px;
                color: #666;
            }}
            .footer {{ 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="municipality-name">{municipality_config.get('official_name', 'PRIMĂRIA COMUNEI')}</div>
            <div style="font-size: 14px;">{municipality_config.get('address', 'Adresa primăriei')}</div>
            <div style="font-size: 14px;">Tel: {municipality_config.get('contact_phone', '0256 123 456')} | Email: {municipality_config.get('contact_email', 'contact@primarie.ro')}</div>
        </div>
        
        <div class="reference-number">
            Nr. {data.get('reference_number', 'DOC-XXXX-XXXX')}<br>
            Data: {current_date}
        </div>
        
        <div class="document-title">DOCUMENT OFICIAL</div>
        
        <div class="content">
            <p>Către: <strong>{data.get('citizen_name', 'N/A')}</strong></p>
            
            <p>Prin prezentul document vă informăm că cererea dumneavoastră cu numărul de referință 
            <strong>{data.get('reference_number', 'N/A')}</strong> a fost procesată.</p>
            
            <p>Pentru informații suplimentare, vă rugăm să contactați primăria la numerele afișate în antet.</p>
        </div>
        
        <div class="signature-section">
            <div style="display: inline-block; text-align: center;">
                <div style="margin-bottom: 50px;">PRIMAR</div>
                <div style="border-top: 1px solid #000; padding-top: 5px; width: 200px;">
                    {municipality_config.get('mayor_name', 'Numele Primarului')}
                </div>
            </div>
        </div>
        
        <div class="stamp-area">
            [ȘTAMPILA PRIMĂRIEI]
        </div>
        
        <div class="footer">
            Document generat electronic în data {current_date}<br>
            Verifică autenticitatea la: {municipality_config.get('website_url', 'www.primarie.ro')}/verificare/{data.get('reference_number', 'XXX')}
        </div>
    </body>
    </html>
    """


def save_pdf_document(pdf_content: bytes, reference_number: str) -> str:
    """
    Salvează documentul PDF generat
    """
    # Creează directorul dacă nu există
    documents_dir = Path("uploads/documents")
    documents_dir.mkdir(parents=True, exist_ok=True)
    
    # Generează numele fișierului
    filename = f"{reference_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    file_path = documents_dir / filename
    
    # Salvează fișierul
    with open(file_path, 'wb') as f:
        f.write(pdf_content)
    
    return str(file_path)


def get_document_download_url(reference_number: str, file_path: str) -> str:
    """
    Generează URL-ul pentru descărcarea documentului
    """
    return f"/api/v1/documents/download/{reference_number}"


# Funcție principală pentru generarea documentelor
def generate_official_document(
    document_type: str, 
    submission_data: Dict[str, Any], 
    municipality_config: Dict[str, Any]
) -> Dict[str, str]:
    """
    Generează un document oficial și returnează informațiile despre fișier
    
    Returns:
        Dict cu keys: file_path, download_url, filename
    """
    
    # Generează conținutul PDF
    pdf_content = create_mock_pdf_content(document_type, submission_data, municipality_config)
    
    # Salvează documentul
    file_path = save_pdf_document(pdf_content, submission_data.get('reference_number', 'UNKNOWN'))
    
    # Generează URL-ul de descărcare
    download_url = get_document_download_url(
        submission_data.get('reference_number', 'UNKNOWN'), 
        file_path
    )
    
    # Generează numele de fișier user-friendly
    document_names = {
        'certificat-urbanism': 'Certificat_Urbanism',
        'certificat-fiscal': 'Certificat_Fiscal',
        'adeverinta-domiciliu': 'Adeverinta_Domiciliu',
        'autorizatie-constructie': 'Autorizatie_Constructie',
        'licenta-functionare': 'Licenta_Functionare',
        'cerere-racordare': 'Aprobare_Racordare'
    }
    
    document_name = document_names.get(document_type, 'Document_Oficial')
    filename = f"{document_name}_{submission_data.get('reference_number', 'XXX')}.html"
    
    return {
        'file_path': file_path,
        'download_url': download_url,
        'filename': filename,
        'mime_type': 'text/html',  # În producție va fi 'application/pdf'
        'generated_at': datetime.now().isoformat()
    }