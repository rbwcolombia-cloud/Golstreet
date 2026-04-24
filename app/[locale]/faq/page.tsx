import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PreguntaFrecuente {
  pregunta: string
  respuesta: string
}

interface Categoria {
  titulo: string
  icono: string
  preguntas: PreguntaFrecuente[]
}

const CATEGORIAS: Categoria[] = [
  {
    titulo: 'Monedas y Pozo',
    icono: '💰',
    preguntas: [
      {
        pregunta: '¿Con cuánto dinero empiezo?',
        respuesta: 'Recibes $10,000 monedas virtuales al registrarte. Estas monedas NO son dinero real. Son para jugar dentro de GolStreet.',
      },
      {
        pregunta: '¿Qué pasa si me quedo sin monedas?',
        respuesta: 'Puedes seguir en el juego. Tus partes de equipos siguen teniendo valor. Intenta vender algo para conseguir monedas disponibles.',
      },
      {
        pregunta: '¿Las monedas pierden valor si no las uso?',
        respuesta: 'Sí. Las monedas que tienes sin invertir bajan 1% por día. Esto es para que el juego sea más activo y justo para todos.',
      },
      {
        pregunta: '¿Cómo funcionan los premios reales?',
        respuesta: 'El organizador de tu liga define un pozo de premios (ej: $500). Al final del torneo, la app calcula quién ganó más monedas y muestra la distribución. El organizador entrega los premios directamente. GolStreet nunca toca dinero real.',
      },
      {
        pregunta: '¿Puedo entrar tarde al torneo?',
        respuesta: 'Sí, pero recibes menos monedas. Si entras antes de Octavos recibes $7,000. Si entras antes de Cuartos recibes $5,000. En Semis ya no se puede entrar.',
      },
    ],
  },
  {
    titulo: 'Comprar y Vender',
    icono: '📈',
    preguntas: [
      {
        pregunta: '¿Cómo compro partes de un equipo?',
        respuesta: 'Ve al Mercado, elige un equipo, y define cuántas partes quieres comprar. El sistema calcula el costo total incluyendo la comisión del 2%. Luego confirmas y listo.',
      },
      {
        pregunta: '¿Cuándo puedo vender?',
        respuesta: 'Puedes vender en cualquier momento mientras el mercado esté activo. El único momento en que no puedes operar es los 5 minutos antes de que empiece un partido.',
      },
      {
        pregunta: '¿Qué es vender con precio mínimo?',
        respuesta: 'Es cuando defines el mínimo que aceptas recibir. Si el equipo está a $800 pero tú quieres mínimo $900, la app espera hasta que suba y vende automáticamente cuando llegue a $900.',
      },
      {
        pregunta: '¿Qué cobra GolStreet por cada operación?',
        respuesta: 'El 2% sobre el valor de la operación, tanto en compras como en ventas. Esta comisión financia el Banco del Torneo, que garantiza que siempre haya compradores disponibles.',
      },
    ],
  },
  {
    titulo: 'Equipos y Precios',
    icono: '⚽',
    preguntas: [
      {
        pregunta: '¿Cómo se calcula el precio de un equipo?',
        respuesta: 'El precio sube cuando más gente compra y baja cuando venden. También sube o baja por eventos del partido (goles, tarjetas) y por noticias analizadas con inteligencia artificial. Un equipo popular sube más rápido.',
      },
      {
        pregunta: '¿Por qué hay equipos más baratos que otros?',
        respuesta: 'Los equipos más baratos tienen más riesgo pero también más potencial de subida. Francia empieza cara pero sube menos. Uzbekistán empieza muy barata pero si gana un partido puede subir muchísimo.',
      },
      {
        pregunta: '¿Qué es el precio IPO?',
        respuesta: 'Es el precio de salida al mercado al inicio del torneo. Es el precio de referencia. El precio mínimo de un equipo nunca puede bajar del 40% del precio IPO.',
      },
      {
        pregunta: '¿Cuánto puede subir o bajar un equipo durante un partido?',
        respuesta: 'Máximo +60% de subida y -50% de bajada en un partido. Esto evita movimientos extremos. Fuera de los partidos, los movimientos son más graduales.',
      },
    ],
  },
  {
    titulo: 'Eliminación y Premios',
    icono: '🏆',
    preguntas: [
      {
        pregunta: '¿Qué pasa si mi equipo es eliminado?',
        respuesta: 'El sistema te devuelve una parte de lo que pagaste automáticamente: si fue en Grupos recibes 20%, en Octavos 40%, en Cuartos 60%, en Semis 80%, si fue subcampeón 95%. Si gana el torneo, recibes 200%.',
      },
      {
        pregunta: '¿Qué son los Premios por Avance?',
        respuesta: 'Cada vez que tu equipo pasa de ronda, recibes monedas extra. Si clasifica a Octavos recibes 5% de tu inversión. A Cuartos 10%. A Semis 20%. Si es campeón 50%. Son bonos automáticos.',
      },
      {
        pregunta: '¿Qué son los Días de Cobro?',
        respuesta: 'Son 3 momentos donde el sistema toma una foto del ranking. Día de Cobro 1 al cerrar Grupos, Día de Cobro 2 al cerrar Cuartos, y Día de Cobro Final cuando hay campeón. El último es el que define los premios reales.',
      },
    ],
  },
  {
    titulo: 'Alertas y Entrada Tardía',
    icono: '🔔',
    preguntas: [
      {
        pregunta: '¿Qué es el Broker Personal?',
        respuesta: 'Es un asistente dentro de la app que te avisa en momentos clave: cuando tu equipo va perdiendo, cuando hay una tarjeta roja, cuando tienes monedas sin usar por mucho tiempo. Siempre te muestra dos opciones y nunca decide por ti.',
      },
      {
        pregunta: '¿Qué pasa si entro tarde a la liga?',
        respuesta: 'Dependiendo de en qué ronda estén, recibes menos monedas para empezar. Esto es justo para quienes entraron desde el inicio. El admin de tu liga puede cambiar estas condiciones.',
      },
      {
        pregunta: '¿Puedo ver el ranking sin entrar a la app?',
        respuesta: 'Sí. Cada liga tiene una URL pública que puedes poner en un televisor. Muestra el ticker de precios, la tabla de equipos y el ranking en tiempo real. No necesitas iniciar sesión.',
      },
    ],
  },
]

export default function PaginaFAQ() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black">
          <span className="text-emerald-400">Gol</span>
          <span className="text-zinc-100">Street</span>
        </Link>
        <Link href="/mercado">
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-900">
            Ir al mercado →
          </Button>
        </Link>
      </nav>

      <main className="container mx-auto px-6 py-16 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-3">Preguntas frecuentes</h1>
          <p className="text-zinc-400">Todo lo que necesitas saber para jugar en GolStreet</p>
        </div>

        <div className="space-y-10">
          {CATEGORIAS.map((cat) => (
            <section key={cat.titulo}>
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-200 mb-4">
                <span>{cat.icono}</span>
                {cat.titulo}
              </h2>
              <div className="space-y-3">
                {cat.preguntas.map((pq, i) => (
                  <details
                    key={i}
                    className="bg-zinc-900 rounded-xl border border-zinc-800 group"
                  >
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-semibold text-zinc-200 hover:text-zinc-100 transition-colors">
                      {pq.pregunta}
                      <span className="text-zinc-600 group-open:rotate-180 transition-transform ml-4 shrink-0">▼</span>
                    </summary>
                    <div className="px-5 pb-4 text-zinc-400 leading-relaxed">
                      {pq.respuesta}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-zinc-500 mb-4">¿Listo para empezar?</p>
          <Link href="/registro">
            <Button className="bg-emerald-600 hover:bg-emerald-500 px-8">
              Crear mi cuenta →
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
