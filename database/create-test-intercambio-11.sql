-- Script para crear un intercambio de prueba si no existe el ID 11
DO $$
DECLARE
    _intercambio_id INTEGER := 11;
    _usuario_propone_id INTEGER := 1; -- Asegúrate de que este usuario exista
    _usuario_recibe_id INTEGER := 19;  -- Asegúrate de que este usuario exista
    _producto_ofrecido_id INTEGER := 16; -- Asegúrate de que este producto exista
    _producto_solicitado_id INTEGER := NULL; -- Puede ser NULL según el esquema
    _chat_id INTEGER;
BEGIN
    -- Verificar si el intercambio ya existe
    IF NOT EXISTS (SELECT 1 FROM public.intercambio WHERE intercambio_id = _intercambio_id) THEN
        RAISE NOTICE 'Creando intercambio de prueba con ID %...', _intercambio_id;

        -- Insertar el intercambio de prueba
        INSERT INTO public.intercambio (
            intercambio_id,
            producto_ofrecido_id,
            producto_solicitado_id,
            usuario_propone_id,
            usuario_recibe_id,
            mensaje_propuesta,
            estado,
            fecha_propuesta,
            lugar_encuentro,
            fecha_encuentro
        ) VALUES (
            _intercambio_id,
            _producto_ofrecido_id,
            _producto_solicitado_id,
            _usuario_propone_id,
            _usuario_recibe_id,
            'Propuesta de intercambio de prueba para validación.',
            'pendiente_validacion', -- Estado válido para validación
            NOW() - INTERVAL '1 day',
            'Parque Principal',
            NOW() - INTERVAL '1 hour'
        );

        RAISE NOTICE 'Intercambio de prueba con ID % creado exitosamente.', _intercambio_id;

        -- Crear un chat asociado si no existe
        IF NOT EXISTS (SELECT 1 FROM public.chat WHERE intercambio_id = _intercambio_id) THEN
            RAISE NOTICE 'Creando chat asociado para intercambio ID %...', _intercambio_id;
            INSERT INTO public.chat (intercambio_id, fecha_creacion)
            VALUES (_intercambio_id, NOW())
            RETURNING chat_id INTO _chat_id;
            RAISE NOTICE 'Chat con ID % creado para intercambio ID %.', _chat_id, _intercambio_id;
        ELSE
            SELECT chat_id INTO _chat_id FROM public.chat WHERE intercambio_id = _intercambio_id;
            RAISE NOTICE 'Chat para intercambio ID % ya existe con ID %.', _intercambio_id, _chat_id;
        END IF;

        -- Opcional: Insertar validaciones iniciales si es necesario para el estado 'pendiente_validacion'
        -- Por ejemplo, si solo un usuario ha validado
        IF NOT EXISTS (SELECT 1 FROM public.validacion_intercambio WHERE intercambio_id = _intercambio_id AND usuario_id = _usuario_propone_id) THEN
            INSERT INTO public.validacion_intercambio (intercambio_id, usuario_id, es_exitoso, calificacion, fecha_validacion)
            VALUES (_intercambio_id, _usuario_propone_id, TRUE, 5, NOW() - INTERVAL '1 hour');
            RAISE NOTICE 'Validación inicial para usuario % en intercambio % creada.', _usuario_propone_id, _intercambio_id;
        END IF;

    ELSE
        RAISE NOTICE 'El intercambio con ID % ya existe. No se realizó ninguna acción.', _intercambio_id;
        
        -- Mostrar información del intercambio existente
        RAISE NOTICE 'Información del intercambio existente:';
        FOR rec IN 
            SELECT 
                intercambio_id,
                estado,
                usuario_propone_id,
                usuario_recibe_id,
                producto_ofrecido_id,
                producto_solicitado_id,
                fecha_propuesta
            FROM public.intercambio 
            WHERE intercambio_id = _intercambio_id
        LOOP
            RAISE NOTICE 'ID: %, Estado: %, Propone: %, Recibe: %, Producto Ofrecido: %, Producto Solicitado: %, Fecha: %', 
                rec.intercambio_id, rec.estado, rec.usuario_propone_id, rec.usuario_recibe_id, 
                rec.producto_ofrecido_id, rec.producto_solicitado_id, rec.fecha_propuesta;
        END LOOP;
    END IF;
END $$;
