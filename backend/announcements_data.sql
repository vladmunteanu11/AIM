-- Date de test pentru sistemul de anunțuri

-- Inserare categorii pentru anunțuri
INSERT INTO announcement_categories (name, slug, color, icon, is_active) VALUES
('Anunțuri Oficiale', 'anunturi-oficiale', '#004990', 'megaphone', true),
('Evenimente', 'evenimente', '#28a745', 'calendar-event', true),
('Licitații', 'licitatii', '#dc3545', 'gavel', true),
('Servicii Publice', 'servicii-publice', '#0079C1', 'building', true),
('Mediu', 'mediu', '#28a745', 'tree', true)
ON CONFLICT (slug) DO NOTHING;

-- Inserare anunțuri de test
INSERT INTO announcements (
    title, slug, content, excerpt, category_id, status, 
    is_featured, published_at, created_by, updated_by
) VALUES 
(
    'Programul de audiențe pentru luna Septembrie 2025',
    'program-audiente-septembrie-2025',
    '<p>Vă informăm că programul de audiențe pentru luna septembrie 2025 este următorul:</p>
    <ul>
    <li><strong>Lunea:</strong> 10:00 - 12:00</li>
    <li><strong>Miercurea:</strong> 14:00 - 16:00</li>
    </ul>
    <p>Pentru programări, vă rugăm să utilizați sistemul online sau să sunați la <strong>0256 123 456</strong>.</p>',
    'Anunțăm programul de audiențe pentru luna septembrie 2025. Programări online disponibile.',
    1,
    'published',
    true,
    NOW(),
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111'
),
(
    'Ziua Primăriei - 15 Septembrie 2025',
    'ziua-primariei-septembrie-2025',
    '<p>Cu ocazia Zilei Primăriei, pe data de <strong>15 septembrie 2025</strong>, vă invităm să participați la următoarele activități:</p>
    <h3>Program:</h3>
    <ul>
    <li><strong>10:00</strong> - Deschiderea festivă</li>
    <li><strong>11:00</strong> - Prezentarea realizărilor din ultimul an</li>
    <li><strong>12:00</strong> - Sesiune de întrebări și răspunsuri cu cetățenii</li>
    <li><strong>13:00</strong> - Pauză</li>
    <li><strong>14:00</strong> - Activități pentru copii</li>
    <li><strong>16:00</strong> - Concerte și spectacole</li>
    </ul>
    <p>Locația: Piața Centrală</p>',
    'Invitație la Ziua Primăriei pe 15 septembrie 2025. Program complet și activități pentru toată familia.',
    2,
    'published',
    true,
    NOW(),
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111'
),
(
    'Licitație pentru modernizarea parcului central',
    'licitatie-modernizare-parc-central',
    '<p>Primăria organizează licitație publică pentru modernizarea parcului central.</p>
    <h3>Detalii licitație:</h3>
    <ul>
    <li><strong>Obiect:</strong> Lucrări de modernizare parc central</li>
    <li><strong>Valoare estimată:</strong> 2.500.000 lei</li>
    <li><strong>Termen depunere oferte:</strong> 30 septembrie 2025, ora 16:00</li>
    <li><strong>Deschidere oferte:</strong> 1 octombrie 2025, ora 10:00</li>
    </ul>
    <p>Caietul de sarcini poate fi retras de la Compartimentul Achiziții Publice.</p>',
    'Licitație publică pentru modernizarea parcului central. Valoare: 2.500.000 lei. Termen: 30 septembrie.',
    3,
    'published',
    false,
    NOW(),
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111'
),
(
    'Modificări în programul de colectare a deșeurilor',
    'modificari-program-colectare-deseuri',
    '<p>Începând cu data de <strong>1 septembrie 2025</strong>, programul de colectare a deșeurilor va fi următorul:</p>
    <h3>Nou program:</h3>
    <ul>
    <li><strong>Zona Centrală:</strong> Luni, Miercuri, Vineri - 06:00-10:00</li>
    <li><strong>Zona Industrială:</strong> Marți, Joi, Sâmbătă - 06:00-12:00</li>
    <li><strong>Zona Rezidențială:</strong> Luni, Miercuri, Vineri - 14:00-18:00</li>
    </ul>
    <p>Pentru informații suplimentare, contactați Serviciul de Mediu la <strong>0256 123 789</strong>.</p>',
    'Program nou de colectare deșeuri din 1 septembrie 2025. Detalii pentru toate zonele.',
    5,
    'published',
    false,
    NOW() - INTERVAL '2 days',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111'
);

-- Actualizare evenimente cu date specifice
UPDATE announcements SET 
    event_start_date = '2025-09-15 10:00:00',
    event_end_date = '2025-09-15 18:00:00',
    event_location = 'Piața Centrală, Primăria Exemplu'
WHERE slug = 'ziua-primariei-septembrie-2025';