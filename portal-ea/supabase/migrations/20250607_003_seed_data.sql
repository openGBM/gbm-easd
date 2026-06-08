-- Seed Data: 8 Dimensiones EA y 48 Preguntas
-- Extraído de EA in a Box 2.0 - The Complete Toolkit (páginas 14-17)
-- Fecha: 2025-06-07

-- ============================================================
-- DIMENSIONES (8)
-- ============================================================

INSERT INTO dimensions (id, name, description, display_order, color) VALUES
('8bd7fe57-270e-46d3-8242-a18419109a59', 'Construir el Caso de Negocio para EA', 'Evalúa cómo se establece y comunica el valor de la Arquitectura Empresarial', 1, '#1B2A4A'),
('e4a51595-7cc2-45ba-92dd-f08801fe3c3b', 'Definir Servicios y Métricas de EA', 'Evalúa la definición de servicios, productos y métricas del equipo de EA', 2, '#E85D04'),
('a6667fb2-bc50-42eb-9278-08da5163fffc', 'Identificar Estructura y Roles de EA', 'Evalúa la estructura organizacional y los roles del equipo de arquitectura', 3, '#0EA5E9'),
('4c218302-72af-4eff-a621-5f75164e3b80', 'Iniciar Arquitectura de Negocio', 'Evalúa la co-creación de capacidades de negocio con los socios del negocio', 4, '#D4A017'),
('63f9300f-8e10-46ba-84c7-ed8aedd9cead', 'Establecer Procesos de Planificación de Inversiones', 'Evalúa la planificación de inversiones y roadmaps de capacidades', 5, '#6B7280'),
('46bc9a4d-612e-4fe4-8a62-3f69d7e80e76', 'Establecer Gobernanza Ligera', 'Evalúa los mecanismos de gobernanza arquitectónica', 6, '#DB2777'),
('478cca9a-3ba3-4742-9aca-0b5d151adc15', 'Soportar la Entrega Distribuida', 'Evalúa el soporte a equipos de desarrollo y la entrega de arquitecturas de referencia', 7, '#4F46B5'),
('e99214e1-ff1b-4275-9108-01d4ac782cf7', 'Soportar Decisiones Tecnológicas Lideradas por el Negocio', 'Evalúa el soporte a la innovación y decisiones tecnológicas alineadas al negocio', 8, '#7C2D12')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PREGUNTAS (48 = 6 por dimensión)
-- ============================================================

-- Dimensión 1: Construir el Caso de Negocio para EA
INSERT INTO questions (dimension_id, text, display_order) VALUES
('8bd7fe57-270e-46d3-8242-a18419109a59', 'Identificamos un conjunto preliminar de objetivos y actividades centrales para el grupo de EA.', 1),
('8bd7fe57-270e-46d3-8242-a18419109a59', 'Construimos (o actualizamos) nuestro charter de EA para clarificar el propósito de EA en la organización y con la alta dirección.', 2),
('8bd7fe57-270e-46d3-8242-a18419109a59', 'Seguimos principios clave para un engagement efectivo (ej: flexibilizar el soporte de EA según necesidades del socio de negocio, acelerar el acceso a la experiencia de EA).', 3),
('8bd7fe57-270e-46d3-8242-a18419109a59', 'Adaptamos el estilo de engagement de EA a las preferencias de los líderes de negocio en cuanto a riesgo, retorno y esfuerzo en proyectos de entrega de soluciones.', 4),
('8bd7fe57-270e-46d3-8242-a18419109a59', 'Enfocamos la actividad de EA en lugares donde las competencias y habilidades del equipo dan una clara ventaja comparativa.', 5),
('8bd7fe57-270e-46d3-8242-a18419109a59', 'Aislamos las principales oportunidades de impacto de EA (ej: drivers de valor de negocio, drivers de valor de TI) para simplificar el mensaje de entrega de valor de EA.', 6);

-- Dimensión 2: Definir Servicios y Métricas de EA
INSERT INTO questions (dimension_id, text, display_order) VALUES
('e4a51595-7cc2-45ba-92dd-f08801fe3c3b', 'Agregamos las actividades de EA en un pequeño conjunto de servicios de EA publicados a través de un catálogo de servicios.', 1),
('e4a51595-7cc2-45ba-92dd-f08801fe3c3b', 'Identificamos ofertas de productos de EA centradas en el cliente, ancladas en los trabajos que los stakeholders clave necesitan realizar.', 2),
('e4a51595-7cc2-45ba-92dd-f08801fe3c3b', 'Desarrollamos material de marketing para las ofertas de productos de EA.', 3),
('e4a51595-7cc2-45ba-92dd-f08801fe3c3b', 'Comenzamos con métricas fundacionales de EA para rastrear y refinar las prácticas del programa de EA antes de adoptar métricas de desempeño más maduras.', 4),
('e4a51595-7cc2-45ba-92dd-f08801fe3c3b', 'Rastreamos el progreso de EA contra métricas que reflejan las principales prioridades de los stakeholders clave y adaptamos los scorecards de métricas para diferentes audiencias.', 5),
('e4a51595-7cc2-45ba-92dd-f08801fe3c3b', 'Resumimos una estrategia clara, concisa y medible que clarifica dónde está el equipo de EA, hacia dónde va y cómo llegará allí.', 6);

-- Dimensión 3: Identificar Estructura y Roles de EA
INSERT INTO questions (dimension_id, text, display_order) VALUES
('a6667fb2-bc50-42eb-9278-08da5163fffc', 'Estructuramos EA para adaptarse a la estructura, restricciones y expectativas de nuestra organización e integramos arquitectos para apoyar la toma de decisiones según sea necesario.', 1),
('a6667fb2-bc50-42eb-9278-08da5163fffc', 'Cuestionamos los supuestos que impulsan las actividades existentes de EA y buscamos nuevas necesidades y prioridades no atendidas donde EA pueda entregar valor.', 2),
('a6667fb2-bc50-42eb-9278-08da5163fffc', 'Identificamos los puntos de dolor arquitectónico de la organización y usamos esos puntos de dolor para determinar qué roles de arquitecto se necesitan.', 3),
('a6667fb2-bc50-42eb-9278-08da5163fffc', 'Desarrollamos habilidades de gestión de producto en los arquitectos para soportar mejor las líneas de producto.', 4),
('a6667fb2-bc50-42eb-9278-08da5163fffc', 'Desarrollamos empleados actuales de TI con potencial de arquitecto para complementar los esfuerzos continuos de reclutamiento de candidatos externos experimentados.', 5),
('a6667fb2-bc50-42eb-9278-08da5163fffc', 'Construimos un programa de aprendizaje que enfoca los esfuerzos de desarrollo en comportamientos clave demostrados por arquitectos exitosos, más que en experiencia técnica.', 6);

-- Dimensión 4: Iniciar Arquitectura de Negocio
INSERT INTO questions (dimension_id, text, display_order) VALUES
('4c218302-72af-4eff-a621-5f75164e3b80', 'Co-creamos capacidades de negocio con los socios de negocio — en particular, gerentes de nivel medio — para asegurar relevancia de negocio.', 1),
('4c218302-72af-4eff-a621-5f75164e3b80', 'Consideramos el contexto y la justificación de inversión al redactar capacidades y usamos declaraciones concisas para asegurar la consumibilidad del modelo.', 2),
('4c218302-72af-4eff-a621-5f75164e3b80', 'Evaluamos la importancia estratégica de las capacidades y su desempeño general en términos de personas, procesos, información y tecnología habilitadora.', 3),
('4c218302-72af-4eff-a621-5f75164e3b80', 'Evaluamos el desempeño de las capacidades e identificamos brechas de capacidad usando una variedad de enfoques, incluyendo salud de la información y escenarios de negocio.', 4),
('4c218302-72af-4eff-a621-5f75164e3b80', 'Promovemos las capacidades de negocio como medio para impulsar resultados de negocio y las usamos consistentemente para facilitar conversaciones de planificación.', 5),
('4c218302-72af-4eff-a621-5f75164e3b80', 'Priorizamos capacidades con los líderes de negocio, establecemos objetivos de capacidad y delineamos claramente las inversiones necesarias para avanzar las capacidades priorizadas.', 6);

-- Dimensión 5: Establecer Procesos de Planificación de Inversiones
INSERT INTO questions (dimension_id, text, display_order) VALUES
('63f9300f-8e10-46ba-84c7-ed8aedd9cead', 'Nos enfocamos en entender los objetivos y metas de negocio para identificar las iniciativas de TI necesarias para cerrar brechas de capacidad.', 1),
('63f9300f-8e10-46ba-84c7-ed8aedd9cead', 'Usamos roadmaps de capacidades para coordinar la planificación de inversiones a través de unidades de negocio y líneas de producto.', 2),
('63f9300f-8e10-46ba-84c7-ed8aedd9cead', 'Definimos métricas clave de desempeño y hacemos benchmark del progreso del roadmap contra ellas.', 3),
('63f9300f-8e10-46ba-84c7-ed8aedd9cead', 'Usamos un framework simple para evaluar y comunicar la deuda arquitectónica a socios de negocio y líderes de proyecto.', 4),
('63f9300f-8e10-46ba-84c7-ed8aedd9cead', 'Facilitamos el acceso generalizado a APIs, su creación y compartición para habilitar la interoperabilidad.', 5),
('63f9300f-8e10-46ba-84c7-ed8aedd9cead', 'Hacemos del valor de negocio — no de la eficiencia operacional — la primera consideración en las decisiones de hosting.', 6);

-- Dimensión 6: Establecer Gobernanza Ligera
INSERT INTO questions (dimension_id, text, display_order) VALUES
('46bc9a4d-612e-4fe4-8a62-3f69d7e80e76', 'Usamos un proceso de triaje para limitar la participación de EA a los proyectos más riesgosos, complejos o críticos para el negocio.', 1),
('46bc9a4d-612e-4fe4-8a62-3f69d7e80e76', 'Tenemos mecanismos formales para acelerar la gobernanza sin sacrificar la calidad de las revisiones de proyectos.', 2),
('46bc9a4d-612e-4fe4-8a62-3f69d7e80e76', 'Identificamos y desarrollamos recursos existentes de TI como arquitectos delegados para proveer capacidad flexible y realizar trabajo de arquitectura en nombre de EA.', 3),
('46bc9a4d-612e-4fe4-8a62-3f69d7e80e76', 'Ofrecemos cursos y herramientas para ayudar a la comunidad extendida de desarrollo y entrega de TI a tomar decisiones arquitectónicas sólidas de manera más autónoma.', 4),
('46bc9a4d-612e-4fe4-8a62-3f69d7e80e76', 'Creamos herramientas que ayudan a los usuarios a cumplir sus objetivos de velocidad y hacen que la adherencia a la guía arquitectónica sea una elección fácil.', 5),
('46bc9a4d-612e-4fe4-8a62-3f69d7e80e76', 'Incorporamos y automatizamos la gobernanza en entornos de construcción automatizados para hacer que la adherencia a la gobernanza sea fácil de aplicar.', 6);

-- Dimensión 7: Soportar la Entrega Distribuida
INSERT INTO questions (dimension_id, text, display_order) VALUES
('478cca9a-3ba3-4742-9aca-0b5d151adc15', 'Co-creamos y co-gestionamos arquitecturas de referencia (RA) con expertos en la materia (SMEs) a través de la empresa para asegurar que las RA sean consumibles por audiencias variadas y expandir el alcance de las RA.', 1),
('478cca9a-3ba3-4742-9aca-0b5d151adc15', 'Aplicamos técnicas de gestión de marca (ej: reforzar mensajes clave centrados en beneficios) para socializar las RA, impulsar su uso y mejorar su valor.', 2),
('478cca9a-3ba3-4742-9aca-0b5d151adc15', 'Ponemos a disposición bloques de construcción de aplicaciones conformes con las RA para autoservicio de desarrolladores, habilitando velocidad, solidez arquitectónica y escalabilidad.', 3),
('478cca9a-3ba3-4742-9aca-0b5d151adc15', 'Usamos procesos formalizados de evaluación para calibrar los niveles de supervisión de gobernanza y soporte de EA según la competencia y necesidades de los equipos individuales.', 4),
('478cca9a-3ba3-4742-9aca-0b5d151adc15', 'Construimos un portafolio diverso de plataformas para soportar las ampliamente variadas necesidades digitales y la competencia técnica de toda la comunidad de desarrolladores.', 5),
('478cca9a-3ba3-4742-9aca-0b5d151adc15', 'Ofrecemos servicios de entrega estándar y características de valor agregado en servicios de plataforma para soportar a los desarrolladores, acelerar la entrega y reducir la complejidad.', 6);

-- Dimensión 8: Soportar Decisiones Tecnológicas Lideradas por el Negocio
INSERT INTO questions (dimension_id, text, display_order) VALUES
('e99214e1-ff1b-4275-9108-01d4ac782cf7', 'Asistimos con actividades de innovación en los pasos donde EA puede impactar desproporcionadamente los resultados de experimentación tecnológica.', 1),
('e99214e1-ff1b-4275-9108-01d4ac782cf7', 'Usamos engagement social para facilitar que los equipos en toda la empresa soliciten la opinión de los arquitectos sobre nuevas ideas tecnológicas.', 2),
('e99214e1-ff1b-4275-9108-01d4ac782cf7', 'Emparejamos tecnologías con necesidades de negocio creando un proceso formal de incubación, como fit-for-purpose o pruebas de concepto.', 3),
('e99214e1-ff1b-4275-9108-01d4ac782cf7', 'Soportamos enfoques de planificación estratégica basados en escenarios y disparadores que permiten capacidad de respuesta ante cambios en el entorno de negocio.', 4),
('e99214e1-ff1b-4275-9108-01d4ac782cf7', 'Proporcionamos consultoría digital a líderes de socios de negocio e impulsamos la toma de decisiones consistente a través de las líneas de producto usando la perspectiva de CX transversal.', 5),
('e99214e1-ff1b-4275-9108-01d4ac782cf7', 'Enmarcamos las recomendaciones de EA como opciones — en lugar de imperativos — expresadas en términos de resultados de negocio.', 6);
