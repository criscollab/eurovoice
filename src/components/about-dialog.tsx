'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Radio, Music2, FileText, HelpCircle, Globe2, Heart } from 'lucide-react'
import { useRadioStore } from '@/lib/radio-store'

/**
 * AboutDialog
 *
 * Modal dialog showing information about the radio station:
 *   - Historia: cuando se creó, qué la hace especial
 *   - Legal: términos de uso y política de privacidad
 *   - FAQ: preguntas frecuentes
 *
 * All content is editable text — to customize, edit the constants at the
 * top of this file (HISTORY, LEGAL, FAQ).
 */
export function AboutDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { stations } = useRadioStore()
  const totalSongs = stations.reduce((sum, s) => sum + s._count.songs, 0)
  const totalLanguages = new Set(stations.map((s) => s.language)).size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 opacity-30 blur-sm"
                aria-hidden="true"
              />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-md">
                <Radio className="h-4 w-4 text-white" />
              </div>
            </div>
            Acerca de Euro Voice
          </DialogTitle>
          <DialogDescription>
            Tu radio online multi-emisora, transmitiendo música en distintos idiomas las 24 horas.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="space-y-8 px-6 py-6">
            {/* === Stats quick view === */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/60 bg-secondary/40 p-3 text-center">
                <div className="flex items-center justify-center">
                  <Radio className="h-4 w-4 text-primary mb-1" />
                </div>
                <p className="text-xl font-bold text-foreground">{stations.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Emisoras</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/40 p-3 text-center">
                <div className="flex items-center justify-center">
                  <Music2 className="h-4 w-4 text-primary mb-1" />
                </div>
                <p className="text-xl font-bold text-foreground">{totalSongs}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Canciones</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/40 p-3 text-center">
                <div className="flex items-center justify-center">
                  <Globe2 className="h-4 w-4 text-primary mb-1" />
                </div>
                <p className="text-xl font-bold text-foreground">{totalLanguages}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Idiomas</p>
              </div>
            </div>

            {/* === Historia === */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
                <Radio className="h-5 w-5 text-primary" />
                Nuestra Historia
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Euro Voice</strong> nació como un proyecto
                  apasionado por conectar culturas a través de la música. Inspirados en la rica
                  tradición musical de Europa, decidimos crear una plataforma de radio online que
                  pudiera transmitir música en distintos idiomas, las 24 horas del día, los 7 días
                  de la semana.
                </p>
                <p>
                  Nuestra misión es simple: <em className="text-foreground">llevar la música que
                  amamos a cada rincón del mundo</em>. Cada emisora de Euro Voice está dedicada a un
                  idioma o región específica, permitiendo a los oyentes sumergirse en sonidos
                  auténticos y descubrir artistas que quizás no conocerían de otra manera.
                </p>
                <p>
                  Desde baladas letonas hasta éxitos electrónicos en inglés, pasando por clásicos
                  en español, francés, italiano y más, Euro Voice es un viaje musical sin fronteras.
                  Nuestro equipo selecciona cuidadosamente cada canción que suena en nuestras
                  emisoras, asegurando una experiencia de escucha diversa y enriquecedora.
                </p>
                <p>
                  Gracias por sintonizar Euro Voice. Esperamos que disfrutes la música tanto como
                  nosotros disfrutamos compartirla contigo. 🎧
                </p>
              </div>
            </section>

            {/* === FAQ === */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
                <HelpCircle className="h-5 w-5 text-primary" />
                Preguntas Frecuentes (FAQ)
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger className="text-sm text-left">
                    ¿Euro Voice es gratis?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Sí, Euro Voice es completamente gratis para todos los oyentes. No necesitas
                    registrarte ni pagar para escuchar nuestra música. Solo abre la página, elige
                    una emisora y disfruta.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2">
                  <AccordionTrigger className="text-sm text-left">
                    ¿Necesito una cuenta para escuchar?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    No. La cuenta de administrador solo se usa para gestionar las emisoras y
                    canciones. Los oyentes pueden sintonizar cualquier emisora sin necesidad de
                    iniciar sesión.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3">
                  <AccordionTrigger className="text-sm text-left">
                    ¿Puedo elegir qué canción escuchar?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    ¡Sí! Cada oyente tiene su propia cola de reproducción. Puedes usar los botones
                    de "siguiente" y "anterior", abrir la playlist completa con el botón 📋, y
                    hacer clic en cualquier canción para reproducirla inmediatamente. También puedes
                    activar el modo "repetir" para escuchar tu canción favorita en bucle.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4">
                  <AccordionTrigger className="text-sm text-left">
                    ¿Funciona en móviles y tablets?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Sí, Euro Voice es una aplicación web responsive. Funciona perfectamente en
                    computadores, tablets y móviles. Solo necesitas un navegador moderno
                    (Chrome, Firefox, Safari, Edge) y conexión a internet.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5">
                  <AccordionTrigger className="text-sm text-left">
                    ¿Puedo cambiar entre modo claro y oscuro?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Sí. En la esquina superior derecha verás un icono de luna 🌙 o sol ☀️. Haz
                    clic en él para alternar entre el modo claro (ideal para el día) y el modo
                    oscuro (ideal para la noche o ambientes con poca luz). Tu preferencia se
                    guardará automáticamente.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-6">
                  <AccordionTrigger className="text-sm text-left">
                    ¿Cómo puedo contactar con Euro Voice?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Puedes contactarnos a través de nuestros canales oficiaiales. Si tienes
                    sugerencias, preguntas o quieres colaborar con nosotros, estaremos encantados
                    de escucharte. Utiliza la sección de contacto que pronto estará disponible en
                    esta página.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-7">
                  <AccordionTrigger className="text-sm text-left">
                    ¿La música que suena tiene derechos de autor?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Toda la música que se reproduce en Euro Voice es propiedad de sus respectivos
                    artistas y discográficas. La plataforma se ofrece con fines de promoción
                    cultural y sin ánimo de lucro. Si eres artista y quieres que tu música suene
                    en Euro Voice, o si quieres que retiremos tu contenido, contáctanos.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            {/* === Legal === */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
                <FileText className="h-5 w-5 text-primary" />
                Términos y Privacidad
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Términos de uso</h3>
                  <p>
                    Al acceder y utilizar Euro Voice, aceptas los siguientes términos. Esta
                    plataforma se proporciona "tal cual" y "según disponibilidad", sin garantías
                    de ningún tipo. Nos reservamos el derecho de modificar, suspender o
                    descontinuar el servicio en cualquier momento sin previo aviso.
                  </p>
                  <p className="mt-2">
                    Queda prohibido el uso de Euro Voice para fines ilegales, including pero no
                    limitado a: violar derechos de autor, distribuir contenido malicioso, o
                    intentar acceder no autorizado a nuestros sistemas. Cualquier uso indebido
                    podrá resultar en el bloqueo del acceso a la plataforma.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">Política de privacidad</h3>
                  <p>
                    Euro Voice recopila información mínima necesaria para el funcionamiento del
                    servicio:
                  </p>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>
                      <strong className="text-foreground">Datos de sesión:</strong> un
                      identificador anónimo almacenado en tu navegador (localStorage) para
                      recordar tus preferencias, como el tema (claro/oscuro).
                    </li>
                    <li>
                      <strong className="text-foreground">Estadísticas anónimas:</strong> para
                      mejorar nuestro servicio, registramos el número de oyentes activos y las
                      canciones más reproducidas. No recopilamos información personal identificable.
                    </li>
                    <li>
                      <strong className="text-foreground">Datos de conexión:</strong> país de
                      origen aproximado (detectado por IP, no almacenada) para fines
                      estadísticos agregados.
                    </li>
                  </ul>
                  <p className="mt-2">
                    No vendemos ni compartimos tus datos con terceros. No usamos cookies de
                    seguimiento ni publicidad de terceros. Si tienes preguntas sobre tu
                    privacidad, contáctanos.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">Propiedad intelectual</h3>
                  <p>
                    El diseño, código y marca de Euro Voice son propiedad del proyecto. La música
                    que se reproduce pertenece a sus respectivos artistas y discográficas. Si eres
                    titular de derechos y consideras que tu contenido está siendo utilizado
                    indebidamente, contáctanos para resolverlo a la brevedad.
                  </p>
                </div>
              </div>
            </section>

            {/* === Footer del diálogo === */}
            <div className="border-t border-border/60 pt-4">
              <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                Hecho con <Heart className="h-3 w-3 fill-primary text-primary" /> para los amantes de la música
              </p>
              <p className="mt-1 text-center text-[10px] text-muted-foreground">
                Euro Voice · {new Date().getFullYear()} · Versión 1.0
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
