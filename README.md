# NARUTO: SHINOBI LEGACY

Fan game RPG de mundo abierto inspirado en **Naruto** y **Naruto Shippuden**. Está hecho con HTML5 Canvas, JavaScript vanilla y WebAudio: no necesita instalación, dependencias ni proceso de compilación.

> Proyecto fan no oficial. Naruto y sus personajes pertenecen a Masashi Kishimoto y Shueisha.

## Cómo jugar

1. Descarga o clona el repositorio.
2. Abre `index.html` en un navegador moderno (Chrome, Edge o Firefox). También funciona directamente con `file://`.
3. Si prefieres un servidor local:

```bash
python -m http.server 8765
```

Después visita `http://127.0.0.1:8765`.

El progreso se guarda automáticamente en `localStorage`. Puedes borrar la partida desde **Ajustes**.

## Contenido

- **MODO HISTORIA:** comienza en la Academia Ninja y recorre los 56 arcos de Naruto y Shippuden, incluidos los arcos de relleno. Los arcos se pueden jugar en el orden que quieras y muestran un nivel recomendado.
- **ENTRENAMIENTO:** mundo abierto de Konoha con misiones, combates, rangos y progresión.
- **22 shinobi del roster** más la opción de crear un personaje propio con nombre, aspecto, clan y estilo de combate.
- **Solo Konoha es jugable.** Las demás aldeas aparecen en el mapa y el códice como contenido bloqueado.
- **Misiones D, C, B, A y S.** Las misiones B+ incluyen enfrentamientos contra villanos.
- **Controles de teclado y táctiles**, con diseño adaptable para escritorio, tableta y móvil.
- **Códice, diario, bandanas por rango, música y efectos generados con WebAudio.**

## Controles

### Exploración

| Tecla | Acción |
| --- | --- |
| `W` `A` `S` `D` o flechas | Moverse |
| `Shift` | Esquivar / correr |
| `E` | Hablar, aceptar misiones e interactuar |
| `M` | Tablero de misiones |
| `H` | Crónicas / arcos de historia |
| `J` | Diario shinobi |
| `C` | Códice |
| `Esc` | Menú de pausa |

### Combate

| Tecla | Acción |
| --- | --- |
| `W` `A` `S` `D` o flechas | Moverse |
| `J` | Combo básico de taijutsu |
| `K` | Jutsu 1 |
| `L` | Jutsu 2 |
| `U` | Técnica definitiva |
| `Shift` o `Espacio` | Esquivar |
| `P` o `Esc` | Pausa |

En móvil y tableta aparece un joystick virtual y botones de acción. Los controles táctiles se activan automáticamente en pantallas táctiles y también se pueden cambiar en **Ajustes**.

## Estructura

```
index.html          Pantallas, HUD y paneles
styles.css          Estilos responsive y temas visuales
js/data.js          Personajes, arcos, misiones y rangos
js/art.js           Sprites, retratos, bandanas y escenarios
js/audio.js         Música y efectos con WebAudio
js/story.js         Configuración de la historia y los 56 arcos
js/battle.js        Combate, oleadas y resultados
js/world.js         Mundo abierto, movimiento y NPC
js/main.js          Controlador, guardado, creación y códice
assets/             Retratos, mapas, bandanas y tipografías
```

## Herramientas de desarrollo

Los scripts de Python incluidos (`fetch_portraits.py`, `parse_arcs.py` y `contact.py`) son utilidades opcionales usadas para preparar retratos y datos. El juego no los necesita para ejecutarse.

## Créditos

- Código, arte procedural, escenarios y audio: proyecto fan.
- Retratos de personajes: Naruto Fandom Wiki. Los derechos pertenecen a sus autores originales.
- Mapas, bandanas y material de referencia: recursos del proyecto.
- Tipografías **Bebas Neue** y **Rajdhani**, distribuidas bajo SIL Open Font License.

Este es un proyecto fan sin ánimo de lucro. No está afiliado a Shueisha, TV Tokyo ni a los titulares oficiales de la franquicia.
