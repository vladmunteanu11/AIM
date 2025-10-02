-- Pagini conform structurii obligatorii #DigiLocal

-- Pagini principale pentru "Despre Primărie"
INSERT INTO pages (title, slug, content, excerpt, category_id, status, menu_order, published_at, created_by, updated_by) VALUES
('Despre Primăria Exemplu', 'despre-primarie', 
'<h2>Bine ați venit pe site-ul oficial al Primăriei Exemplu</h2>
<p>Primăria Exemplu este o instituție publică modernă, dedicată servirii comunității și dezvoltării locale durabile. Ne mândrim cu o echipă competentă de specialiști care lucrează zilnic pentru îmbunătățirea calității vieții cetățenilor noștri.</p>

<h3>Misiunea noastră</h3>
<p>Să oferim servicii publice de calitate, transparente și eficiente, contribuind la dezvoltarea economică, socială și culturală a comunității locale.</p>

<h3>Viziunea noastră</h3>
<p>O comunitate prosperă, modernă și sustenabilă, în care fiecare cetățean se simte apreciat și implicat în dezvoltarea localității.</p>

<h3>Valorile noastre</h3>
<ul>
<li><strong>Transparența</strong> - în toate deciziile și procesele administrative</li>
<li><strong>Integritatea</strong> - în relațiile cu cetățenii și partenerii</li>
<li><strong>Eficiența</strong> - în prestarea serviciilor publice</li>
<li><strong>Inovația</strong> - în adoptarea soluțiilor digitale</li>
</ul>',
'Informații generale despre Primăria Exemplu, misiunea, viziunea și valorile instituției.',
1, 'published', 1, NOW(),
'11111111-1111-1111-1111-111111111111',
'11111111-1111-1111-1111-111111111111'),

('Organizarea Primăriei', 'organizarea-primariei',
'<h2>Structura Organizatorică</h2>
<p>Primăria Exemplu funcționează în conformitate cu prevederile legale în vigoare și este organizată în următoarele compartimente:</p>

<h3>Consiliul Local</h3>
<p>Consiliul Local al Orașului Exemplu este format din <strong>15 consilieri locali</strong> aleși prin vot democratic pentru un mandat de 4 ani.</p>

<h3>Aparatul de specialitate al Primarului</h3>
<ul>
<li><strong>Secretariat General</strong></li>
<li><strong>Compartimentul Juridic</strong></li>
<li><strong>Serviciul Financiar-Contabil</strong></li>
<li><strong>Compartimentul Urbanism</strong></li>
<li><strong>Serviciul de Evidență a Persoanelor</strong></li>
<li><strong>Compartimentul Pază și Protecție</strong></li>
</ul>

<h3>Servicii Publice Locale</h3>
<ul>
<li>Serviciul Public de Evidență Persoane</li>
<li>Serviciul Public de Asistență Socială</li>
<li>Poliția Locală</li>
</ul>',
'Structura organizatorică completă a Primăriei Exemplu și compartimentele funcționale.',
1, 'published', 2, NOW(),
'11111111-1111-1111-1111-111111111111',
'11111111-1111-1111-1111-111111111111'),

('Conducerea Primăriei', 'conducerea-primariei',
'<h2>Conducerea Executivă</h2>

<h3>Primar - Ion Popescu</h3>
<p>Domnul Ion Popescu este primarul Comunei Exemplu din anul 2020, fiind ales cu un procent de 67% din voturile valabil exprimate.</p>

<p><strong>Experiența profesională:</strong></p>
<ul>
<li>Inginer constructor - 15 ani</li>
<li>Manager în administrația publică - 8 ani</li>
<li>Consilier local - 4 ani</li>
</ul>

<p><strong>Program de audiențe:</strong></p>
<ul>
<li>Lunea: 10:00 - 12:00</li>
<li>Miercurea: 14:00 - 16:00</li>
</ul>

<h3>Viceprimar - Maria Ionescu</h3>
<p>Doamna Maria Ionescu este viceprimarul comunei, cu responsabilități în domeniile:</p>
<ul>
<li>Servicii sociale și comunitare</li>
<li>Educație și cultură</li>
<li>Relații cu organizațiile neguvernamentale</li>
</ul>

<h3>Secretar General - Gheorghe Marinescu</h3>
<p>Domnul Gheorghe Marinescu coordonează activitatea aparatului de specialitate și asigură respectarea legalității actelor administrative.</p>',
'Prezentarea conducerii executive a Primăriei Exemplu și responsabilitățile acesteia.',
1, 'published', 3, NOW(),
'11111111-1111-1111-1111-111111111111',
'11111111-1111-1111-1111-111111111111');

-- Pagini pentru "Informații de Interes Public" 
INSERT INTO pages (title, slug, content, excerpt, category_id, status, menu_order, published_at, created_by, updated_by) VALUES
('Buget și Execuție Bugetară', 'buget-executie-bugetara',
'<h2>Bugetul Local pentru anul 2025</h2>
<p>Bugetul local al Comunei Exemplu pentru anul 2025 a fost aprobat prin <strong>Hotărârea Consiliului Local nr. 15/2025</strong>.</p>

<h3>Venituri Bugetare - 12.500.000 lei</h3>
<ul>
<li>Impozite și taxe locale: 4.200.000 lei (33.6%)</li>
<li>Sume defalcate din impozitul pe venit: 3.800.000 lei (30.4%)</li>
<li>Transferuri de la bugetul de stat: 2.900.000 lei (23.2%)</li>
<li>Fonduri europene: 1.600.000 lei (12.8%)</li>
</ul>

<h3>Cheltuieli Bugetare</h3>
<ul>
<li>Administrație publică: 3.100.000 lei</li>
<li>Învățământ: 2.800.000 lei</li>
<li>Sănătate și asistență socială: 1.900.000 lei</li>
<li>Cultură, recreere și religie: 1.200.000 lei</li>
<li>Dezvoltare locală: 3.500.000 lei</li>
</ul>

<h3>Documente disponibile pentru descărcare:</h3>
<ul>
<li><a href="#" target="_blank">Bugetul local 2025 (PDF)</a></li>
<li><a href="#" target="_blank">Execuția bugetară T1 2025 (PDF)</a></li>
<li><a href="#" target="_blank">Raportul semestrial 2025 (PDF)</a></li>
</ul>',
'Informații despre bugetul local și execuția bugetară pentru comuna Exemplu.',
2, 'published', 1, NOW(),
'11111111-1111-1111-1111-111111111111',
'11111111-1111-1111-1111-111111111111'),

('Achiziții Publice', 'achizitii-publice',
'<h2>Achiziții Publice - Transparență Totală</h2>
<p>Primăria Exemplu derulează toate achizițiile publice în conformitate cu legislația în vigoare, asigurând transparență maximă și utilizarea eficientă a fondurilor publice.</p>

<h3>Achiziții în derulare</h3>
<table border="1" style="width:100%; border-collapse: collapse;">
<tr style="background-color: #004990; color: white;">
<th>Obiectul achiziției</th>
<th>Valoare estimată</th>
<th>Termen limită</th>
<th>Status</th>
</tr>
<tr>
<td>Modernizare parc central</td>
<td>2.500.000 lei</td>
<td>30.09.2025</td>
<td>Licitație publică</td>
</tr>
<tr>
<td>Servicii de întreținere spații verzi</td>
<td>850.000 lei</td>
<td>15.10.2025</td>
<td>Procedură simplificată</td>
</tr>
<tr>
<td>Echipamente IT pentru școli</td>
<td>420.000 lei</td>
<td>20.09.2025</td>
<td>Licitație restricționată</td>
</tr>
</table>

<h3>Achiziții finalizate în 2025</h3>
<ul>
<li>Reabilitare drumuri comunale - 1.800.000 lei</li>
<li>Sistem de supraveghere video - 320.000 lei</li>
<li>Mobilier urban pentru parcuri - 150.000 lei</li>
</ul>

<h3>Contact Compartiment Achiziții</h3>
<p><strong>Responsabil:</strong> Ing. Andrei Gheorghiu<br>
<strong>Email:</strong> achizitii@primaria-exemplu.ro<br>
<strong>Telefon:</strong> 0256 123 460</p>',
'Informații despre achizițiile publice derulate de Primăria Exemplu.',
2, 'published', 2, NOW(),
'11111111-1111-1111-1111-111111111111',
'11111111-1111-1111-1111-111111111111');

-- Pagini pentru "Servicii Publice"
INSERT INTO pages (title, slug, content, excerpt, category_id, status, menu_order, published_at, created_by, updated_by) VALUES
('Ghidul Serviciilor Publice', 'ghidul-serviciilor-publice',
'<h2>Servicii Publice Disponibile</h2>
<p>Primăria Exemplu oferă o gamă completă de servicii publice pentru cetățeni, atât în format tradițional cât și digital.</p>

<h3>🏛️ Servicii Administrative</h3>
<ul>
<li><strong>Eliberare certificate de urbanism</strong> - Termen: 30 zile</li>
<li><strong>Autorizații de construire</strong> - Termen: 45 zile</li>
<li><strong>Autorizații de demolare</strong> - Termen: 15 zile</li>
<li><strong>Certificate de nomenclatură stradală</strong> - Termen: 5 zile</li>
</ul>

<h3>👥 Servicii de Evidență Persoane</h3>
<ul>
<li><strong>Eliberare certificate de stare civilă</strong> - Termen: imediat</li>
<li><strong>Înregistrare căsătorii</strong> - Programare obligatorie</li>
<li><strong>Înregistrare decese</strong> - Termen: imediat</li>
<li><strong>Schimbare domiciliu/reședință</strong> - Termen: imediat</li>
</ul>

<h3>💰 Servicii Fiscale</h3>
<ul>
<li><strong>Plata taxelor și impozitelor locale</strong> - Online sau la ghișeu</li>
<li><strong>Înregistrare/radiere contribuabili</strong> - Termen: 5 zile</li>
<li><strong>Acordare facilități fiscale</strong> - Analiză individuală</li>
</ul>

<h3>🌐 Servicii Online Disponibile</h3>
<ul>
<li>Programări online pentru audiențe</li>
<li>Depunere cereri și formulare</li>
<li>Plată online taxe și impozite</li>
<li>Urmărire status dosare</li>
</ul>

<p><strong>💡 Sfat:</strong> Majoritatea serviciilor pot fi inițiate online prin completarea formularelor de pe acest site!</p>',
'Ghid complet al serviciilor publice oferite de Primăria Exemplu.',
5, 'published', 1, NOW(),
'11111111-1111-1111-1111-111111111111',
'11111111-1111-1111-1111-111111111111');

-- Pagină pentru Contact
INSERT INTO pages (title, slug, content, excerpt, category_id, status, menu_order, published_at, created_by, updated_by) VALUES
('Contact și Informații Utile', 'contact-informatii-utile',
'<h2>Date de Contact</h2>

<h3>📍 Adresa Sediului</h3>
<p><strong>Primăria Comunei Exemplu</strong><br>
Strada Principală nr. 1<br>
Comuna Exemplu, Județul Exemplu<br>
Cod poștal: 123456</p>

<h3>📞 Telefon și Fax</h3>
<ul>
<li><strong>Telefon:</strong> 0256 123 456</li>
<li><strong>Fax:</strong> 0256 123 457</li>
<li><strong>Email oficial:</strong> contact@primaria-exemplu.ro</li>
</ul>

<h3>🕐 Program de Lucru cu Publicul</h3>
<table border="1" style="width:100%; border-collapse: collapse;">
<tr style="background-color: #004990; color: white;">
<th>Ziua</th>
<th>Program</th>
</tr>
<tr><td>Luni</td><td>08:00 - 16:00</td></tr>
<tr><td>Marți</td><td>08:00 - 16:00</td></tr>
<tr><td>Miercuri</td><td>08:00 - 16:00</td></tr>
<tr><td>Joi</td><td>08:00 - 16:00</td></tr>
<tr><td>Vineri</td><td>08:00 - 14:00</td></tr>
<tr><td>Sâmbătă</td><td>Închis</td></tr>
<tr><td>Duminică</td><td>Închis</td></tr>
</table>

<h3>👨‍💼 Program Audiențe Primar</h3>
<ul>
<li><strong>Luni:</strong> 10:00 - 12:00</li>
<li><strong>Miercuri:</strong> 14:00 - 16:00</li>
</ul>
<p><em>Pentru audiențe este necesară programarea prealabilă online sau telefonic.</em></p>

<h3>🚨 Contacte de Urgență</h3>
<ul>
<li><strong>Poliția Locală:</strong> 0256 123 789</li>
<li><strong>Servicii Publice:</strong> 0256 123 678</li>
<li><strong>Situații de urgență:</strong> 112</li>
</ul>

<h3>💻 Prezența Online</h3>
<ul>
<li><strong>Website:</strong> www.primaria-exemplu.ro</li>
<li><strong>Facebook:</strong> @PrimariaExemplu</li>
<li><strong>Email informații:</strong> info@primaria-exemplu.ro</li>
</ul>',
'Informații complete de contact și program de funcționare al Primăriei Exemplu.',
NULL, 'published', 1, NOW(),
'11111111-1111-1111-1111-111111111111',
'11111111-1111-1111-1111-111111111111');