-- Migration: 002_phase2_seed_demo_events.sql
-- Description: Seed 30 realistic demo events around the world with is_demo = true
-- To clean up at any time: DELETE FROM public.events WHERE is_demo = true;

DO $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Delete existing demo events before reseeding
  DELETE FROM public.events WHERE is_demo = true;

  -- Insert 30 realistic demo events
  INSERT INTO public.events (
    id, owner_id, title, artist_name, venue_name, address, lat, lng, approximate_location,
    starts_at, timezone, genre, event_type, image_url, description, ticket_url, price_text,
    is_free, lineup, status, is_featured, is_demo
  )
  VALUES
    -- 1. Rome (Featured)
    (
      '00000000-0000-0000-0001-000000000001', demo_user_id,
      'Echoes of the Colosseum: Secret Rooftop Session', 'Luna Velata', 'Lanificio 159 Rooftop',
      'Via di Pietralata 159, Roma', 41.9167, 12.5447, false,
      now() + interval '6 hours', 'Europe/Rome', 'Indie Rock', 'concert',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
      'An intimate sunset-to-midnight acoustic & dream-pop performance overlooking the urban horizon of Rome.',
      'https://dice.fm', '€12', false, ARRAY['Luna Velata', 'Marco Vesper'], 'published', true, true
    ),
    -- 2. Milan (Featured)
    (
      '00000000-0000-0000-0001-000000000002', demo_user_id,
      'Neon Underground: Modular Synthesizer Night', 'Kroma Synth Collective', 'Tunnel Club Milano',
      'Via Giovanni Battista Sammartini 30, Milano', 45.4912, 9.2084, false,
      now() + interval '2 days 4 hours', 'Europe/Rome', 'Electronic', 'club night',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
      'Raw analog pulses and hypnotic visual mapping inside the historic railway arches of Milan.',
      'https://residentadvisor.net', '€15 with drink', false, ARRAY['Kroma', 'Sub-Zero Pulse'], 'published', true, true
    ),
    -- 3. Berlin (Featured)
    (
      '00000000-0000-0000-0001-000000000003', demo_user_id,
      'Kraftwerk Shadows: Darkwave & Industrial Live', 'Staub & Neon', 'Urban Spree Gallery & Yard',
      'Revaler Str. 99, 10245 Berlin', 52.5085, 13.4542, false,
      now() + interval '3 days 3 hours', 'Europe/Berlin', 'Post-Punk', 'concert',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
      'Heavy drum machines, analog chorus guitars and visceral Berlin underground energy.',
      'https://dice.fm', '€18', false, ARRAY['Staub & Neon', 'Kalter Regen'], 'published', true, true
    ),
    -- 4. London
    (
      '00000000-0000-0000-0001-000000000004', demo_user_id,
      'Hackney Jazz Basement & Free Jam', 'The Dalston Sextet', 'Vortex Jazz Cellar',
      '11 Gillett Square, London N16 8AZ', 51.5492, -0.0763, false,
      now() + interval '1 day 2 hours', 'Europe/London', 'Jazz', 'open mic',
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=900&q=80',
      'Late night spiritual jazz followed by an open stage jam session for local musicians.',
      NULL, 'Free admission', true, ARRAY['The Dalston Sextet'], 'published', false, true
    ),
    -- 5. Paris (Approximate location)
    (
      '00000000-0000-0000-0001-000000000005', demo_user_id,
      'Belleville Psych Folk Gathering', 'Clara & The Waves', 'La Bellevilloise Basement',
      '19-21 Rue Boyer, 75020 Paris', 48.8687, 2.3929, true,
      now() + interval '4 days', 'Europe/Paris', 'Folk', 'concert',
      'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=900&q=80',
      'Mesmerizing 12-string acoustic landscapes and French baroque folk storytelling. Exact courtyard shared upon RSVP.',
      'https://dice.fm', '€10', false, NULL, 'published', false, true
    ),
    -- 6. Tokyo
    (
      '00000000-0000-0000-0001-000000000006', demo_user_id,
      'Shibuya City Pop & Vapor Dreams', 'Midnight Ginza Club', 'WWW X Shibuya',
      'Rise Bldg 2F, 13-17 Udagawacho, Tokyo', 35.6617, 139.6983, false,
      now() + interval '7 days', 'Asia/Tokyo', 'Synthwave', 'concert',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80',
      'Nostalgic 80s tape sounds, dreamy brass arrangements and retro Japanese groove aesthetics.',
      'https://eplus.jp', '¥3,500', false, NULL, 'published', false, true
    ),
    -- 7. New York (Approximate location)
    (
      '00000000-0000-0000-0001-000000000007', demo_user_id,
      'Bushwick Warehouse DIY Showcase', 'Static Youth', 'Secret Industrial Loft',
      'Flushing Ave & Morgan, Brooklyn, NY', 40.7061, -73.9329, true,
      now() + interval '2 days 5 hours', 'America/New_York', 'Indie Rock', 'party',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
      'Underground indie showcase supporting local artists. Exact door code unlocked 2 hours before the show.',
      NULL, 'Free donation', true, NULL, 'published', false, true
    ),
    -- 8. Austin
    (
      '00000000-0000-0000-0001-000000000008', demo_user_id,
      'Red River Psych Fest Warmup', 'Desert Fuzz Collective', 'Hotel Vegas Backyard',
      '1502 E 6th St, Austin, TX 78702', 30.2625, -97.7269, false,
      now() + interval '12 days', 'America/Chicago', 'Psychedelic Rock', 'festival',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
      'Four heavy psychedelic fuzz acts under the Texas stars with vintage tape projections.',
      'https://eventbrite.com', '$15', false, NULL, 'published', false, true
    ),
    -- 9. Barcelona
    (
      '00000000-0000-0000-0001-000000000009', demo_user_id,
      'Poblenou Electronic Sound Lab', 'Marina Solar', 'Razzmatazz 3',
      'Carrer dels Almogàvers 122, 08018 Barcelona', 41.3977, 2.1911, false,
      now() + interval '1 day 6 hours', 'Europe/Madrid', 'Electronic', 'club night',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
      'Live hardware modular techno and ambient textures in the heart of Barcelona creative district.',
      'https://dice.fm', '€14', false, NULL, 'published', false, true
    ),
    -- 10. Amsterdam
    (
      '00000000-0000-0000-0001-000000000010', demo_user_id,
      'Noord Canal House Ambient Sessions', 'Tide & Echo', 'Garage Noord',
      'Gedempt Hamerkanaal 40, 1021 KM Amsterdam', 52.3853, 4.9221, false,
      now() + interval '5 days', 'Europe/Amsterdam', 'Ambient', 'concert',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=900&q=80',
      'Subtle generative drones and analog tape loops in an industrial warehouse setting.',
      NULL, 'Free / Donations', true, NULL, 'published', false, true
    ),
    -- 11. São Paulo
    (
      '00000000-0000-0000-0001-000000000011', demo_user_id,
      'Vila Madalena Samba-Jazz Fusion', 'Orquestra Tropicalia Nova', 'Casa das Caldeiras',
      'Av. Francisco Matarazzo 2000, São Paulo', -23.5284, -46.6749, false,
      now() + interval '9 days', 'America/Sao_Paulo', 'Jazz', 'festival',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80',
      'Explosive Brazilian percussion, 7-string nylon guitar and vibrant afro-latin live horns.',
      'https://sympla.com.br', 'R$ 35', false, NULL, 'published', false, true
    ),
    -- 12. Melbourne (Approximate location)
    (
      '00000000-0000-0000-0001-000000000012', demo_user_id,
      'Fitzroy Rooftop Indie Jams', 'The St Kilda Drift', 'The Night Cat Alley',
      '137 Johnston St, Fitzroy VIC 3065', -37.7997, 144.9786, true,
      now() + interval '8 days', 'Australia/Melbourne', 'Indie Rock', 'concert',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
      'Sun-drenched jangly guitar pop and soulful indie melodies from Melbourne brightest emerging songwriters.',
      NULL, 'A$ 15', false, NULL, 'published', false, true
    ),
    -- 13. Reykjavik
    (
      '00000000-0000-0000-0001-000000000013', demo_user_id,
      'Northern Glaciers Ambient & Strings', 'Solrun & Huld', 'Mengí Sound Room',
      'Óðinsgata 2, 101 Reykjavík', 64.1437, -21.9312, false,
      now() + interval '11 days', 'Atlantic/Reykjavik', 'Ambient', 'concert',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
      'Intimate chamber acoustics, bowed vibraphone and field recordings from the Icelandic highlands.',
      'https://tix.is', '2,900 ISK', false, NULL, 'published', false, true
    ),
    -- 14. Naples
    (
      '00000000-0000-0000-0001-000000000014', demo_user_id,
      'Vesuvio Dub & Mediterranean Beats', 'Partenope Sound System', 'Spazio Intolab',
      'Piazza Enrico De Nicola 46, Napoli', 40.8542, 14.2635, false,
      now() + interval '8 hours', 'Europe/Rome', 'Electronic', 'party',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
      'Heavy sub-bass meets traditional Mediterranean vocal scales in the historic center of Naples.',
      NULL, '€5 at entrance', false, NULL, 'published', false, true
    ),
    -- 15. Florence (Approximate location)
    (
      '00000000-0000-0000-0001-000000000015', demo_user_id,
      'Arno Acoustic Riverbank Sessions', 'Duo Rinascimento', 'Spiaggetta sull’Arno',
      'Piazza Giuseppe Poggi, Firenze', 43.7651, 11.2647, true,
      now() + interval '2 days 1 hour', 'Europe/Rome', 'Folk', 'open mic',
      'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=900&q=80',
      'Open air sunset acoustic guitar jam along the riverbanks with chilled drinks and natural acoustics.',
      NULL, 'Free entry', true, NULL, 'published', false, true
    ),
    -- 16. Bologna
    (
      '00000000-0000-0000-0001-000000000016', demo_user_id,
      'Portici Underground Post-Hardcore', 'Radici Spezzate', 'Covo Club Basement',
      'Viale Zagabria 1, Bologna', 44.5097, 11.3719, false,
      now() + interval '3 days 6 hours', 'Europe/Rome', 'Post-Punk', 'concert',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
      'High voltage energetic riffs and poetic scream vocals in the legendary indie basement of Bologna.',
      'https://covoclub.it', '€8 with ARCI card', false, NULL, 'published', false, true
    ),
    -- 17. Dublin
    (
      '00000000-0000-0000-0001-000000000017', demo_user_id,
      'Temple Bar Traditional & Modern Trad', 'The Shannon Waves', 'The Cobblestone Backroom',
      '77 King St N, Smithfield, Dublin 7', 53.3498, -6.2778, false,
      now() + interval '1 day 4 hours', 'Europe/Dublin', 'Folk', 'concert',
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=900&q=80',
      'Pure Irish pipes, fiddle, and contemporary indie trad arrangements in a historic pub.',
      NULL, 'Free entry', true, NULL, 'published', false, true
    ),
    -- 18. Stockholm
    (
      '00000000-0000-0000-0001-000000000018', demo_user_id,
      'Södermalm Nordic Synth & Dream Pop', 'Fjäll Ljus', 'Debaser Strand',
      'Hornstulls strand 4, 117 39 Stockholm', 59.3149, 18.0336, false,
      now() + interval '14 days', 'Europe/Stockholm', 'Synthwave', 'concert',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80',
      'Crystalline synths, reverb-soaked Swedish vocals and deep rhythmic basslines.',
      'https://tickster.com', '180 SEK', false, NULL, 'published', false, true
    ),
    -- 19. Vienna
    (
      '00000000-0000-0000-0001-000000000019', demo_user_id,
      'Danube Electric Micro-Festival', 'Wiener Klangwerk', 'Flex Underground',
      'Augartenbrücke 1, 1010 Wien', 48.2198, 16.3711, false,
      now() + interval '16 days', 'Europe/Vienna', 'Electronic', 'festival',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
      'An eclectic lineup of experimental club music and bass culture beside the Danube canal.',
      'https://oeticket.com', '€16', false, NULL, 'published', false, true
    ),
    -- 20. Montreal
    (
      '00000000-0000-0000-0001-000000000020', demo_user_id,
      'Mile End Lo-Fi Cassette Release', 'Bleu St-Laurent', 'Casa del Popolo',
      '4873 St Laurent Blvd, Montreal, QC H2T 1R6', 45.5218, -73.5898, false,
      now() + interval '4 days 2 hours', 'America/Toronto', 'Indie Rock', 'concert',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
      'Intimate vegetarian cafe gig celebrating the launch of new DIY indie recordings.',
      NULL, '12 CAD', false, NULL, 'published', false, true
    ),
    -- 21. Seoul
    (
      '00000000-0000-0000-0001-000000000021', demo_user_id,
      'Hongdae Indie Garage Showcase', 'Neon Han River', 'Club FF Hongdae',
      '364-24 Seogyo-dong, Mapo-gu, Seoul', 37.5512, 126.9221, false,
      now() + interval '10 days', 'Asia/Seoul', 'Indie Rock', 'concert',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
      'Raw guitars and high-octane stage presence in the heart of Hongdae underground youth culture.',
      'https://interpark.com', '₩20,000', false, NULL, 'published', false, true
    ),
    -- 22. Mexico City
    (
      '00000000-0000-0000-0001-000000000022', demo_user_id,
      'Roma Norte Cumbia Psicodélica', 'Sonidero Cósmico', 'Foro Indie Rocks!',
      'Zacatecas 39, Roma Nte., Cuauhtémoc, 06700 Ciudad de México', 19.4187, -99.1578, false,
      now() + interval '2 days 7 hours', 'America/Mexico_City', 'Psychedelic Rock', 'party',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
      'Fusing tropical accordion grooves, wah-wah guitars and heavy analogue synth bass in CDMX.',
      'https://boletia.com', '$250 MXN', false, NULL, 'published', false, true
    ),
    -- 23. Lisbon (Approximate location)
    (
      '00000000-0000-0000-0001-000000000023', demo_user_id,
      'Miradouro Sun-Downer Electronic Jam', 'Tejo Waves Collective', 'Miradouro de Santa Catarina Kiosk',
      'R. de Santa Catarina, 1200-012 Lisboa', 38.7099, -9.1478, true,
      now() + interval '3 days 1 hour', 'Europe/Lisbon', 'Electronic', 'open mic',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
      'Sunset session overlooking the 25 de Abril bridge with modular ambient and warm deep house.',
      NULL, 'Free open air', true, NULL, 'published', false, true
    ),
    -- 24. Los Angeles
    (
      '00000000-0000-0000-0001-000000000024', demo_user_id,
      'Silver Lake Dream Pop Courtyard', 'Echo Park Siren', 'The Satellite Secret Garden',
      '1717 Silver Lake Blvd, Los Angeles, CA', 34.0886, -118.2694, false,
      now() + interval '18 days', 'America/Los_Angeles', 'Indie Rock', 'concert',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
      'Shimmering chorus guitars, intimate vocal harmonies and chill California dusk vibes.',
      'https://dice.fm', '$18', false, NULL, 'published', false, true
    ),
    -- 25. Chicago
    (
      '00000000-0000-0000-0001-000000000025', demo_user_id,
      'Wicker Park Deep House & Acid Roots', 'Roland 303 Syndicate', 'Smartbar Basement',
      '3730 N Clark St, Chicago, IL 60613', 41.9501, -87.6591, false,
      now() + interval '15 days', 'America/Chicago', 'Electronic', 'club night',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
      'Celebrating the birthplace of house music with authentic vinyl selections and live squelching 303s.',
      'https://residentadvisor.net', '$20', false, NULL, 'published', false, true
    ),
    -- 26. Buenos Aires
    (
      '00000000-0000-0000-0001-000000000026', demo_user_id,
      'Palermo Soho Indie & Tango Reimagined', 'Bandoneón Electrónico', 'Niceto Club Lado B',
      'Niceto Vega 5510, Palermo, Buenos Aires', -34.5881, -58.4358, false,
      now() + interval '21 days', 'America/Argentina/Buenos_Aires', 'Folk', 'concert',
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=900&q=80',
      'Traditional Argentine melancholy colliding with forward-thinking beat production and acoustic bass.',
      'https://passline.com', '$4,000 ARS', false, NULL, 'published', false, true
    ),
    -- 27. Bogota
    (
      '00000000-0000-0000-0001-000000000027', demo_user_id,
      'La Candelaria Andean Folk Sessions', 'Niebla & Tambor', 'Teatro Libre de Chapinero',
      'Cl. 62 #9-65, Bogotá', 4.6486, -74.0617, false,
      now() + interval '22 days', 'America/Bogota', 'Folk', 'concert',
      'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=900&q=80',
      'Ancestral flutes, modern charango, and evocative percussion nestled high in the Andean plateau.',
      'https://tuboleta.com', '$30,000 COP', false, NULL, 'published', false, true
    ),
    -- 28. Sydney
    (
      '00000000-0000-0000-0001-000000000028', demo_user_id,
      'Newtown Psychedelic Sunset Gathering', 'Bondi Mirage', 'The Vanguard Basement',
      '42 King St, Newtown NSW 2042', -33.8966, 151.1798, false,
      now() + interval '25 days', 'Australia/Sydney', 'Psychedelic Rock', 'concert',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
      'Swirling psych rock and soulful fuzz guitars illuminating the bohemian heart of Sydney.',
      'https://moshtix.com.au', 'A$ 22', false, NULL, 'published', false, true
    ),
    -- 29. Istanbul
    (
      '00000000-0000-0000-0001-000000000029', demo_user_id,
      'Bosphorus Anatolian Rock Revival', 'Karaköy Psikedelik', 'Babylon Bomonti',
      'Merkez, Silahşör Caddesi & Birahane Sokak No:1, 34384 Şişli/İstanbul', 41.0583, 28.9798, false,
      now() + interval '27 days', 'Europe/Istanbul', 'Psychedelic Rock', 'concert',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
      'Microtonal electric bağlama, driving bass riffs, and heavy 70s Anatolian rhythms.',
      'https://biletix.com', '350 TRY', false, NULL, 'published', false, true
    ),
    -- 30. Toronto (Approximate location)
    (
      '00000000-0000-0000-0001-000000000030', demo_user_id,
      'Kensington Market Free Open Mic & Jam', 'Queen West Acoustic Circle', 'Supermarket Bar & Stage',
      '268 Augusta Ave, Toronto, ON M5T 2L9', 43.6548, -79.4022, true,
      now() + interval '28 days', 'America/Toronto', 'Folk', 'open mic',
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=900&q=80',
      'Community musical showcase in Kensington Market. Walk-in registrations open 30 minutes before show.',
      NULL, 'Free / PWYC', true, NULL, 'published', false, true
    );
END $$;
