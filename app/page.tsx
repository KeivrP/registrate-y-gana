import RegistroForm from "./RegistroForm";

export default function Home() {
  return (
    <main className="landing">
      {/* 1 · Portada */}
      <section className="hero">
        <img className="hero-logo" src="/img/logo-1stchoice.webp" alt="1st Choice Nutrition" width={600} height={578} />
        <img className="hero-foto" src="/img/pug-gatito.webp" alt="Un pug y un gatito sentados juntos" width={1000} height={1054} />
        <h1 className="hero-titulo">
          La Nutrición es el
          <br />
          <span className="rojo">CORAZÓN</span> de la <span className="rojo">SALUD</span>
        </h1>
        <a className="btn-cta" href="#registro">¡Regístrate y gana!</a>
      </section>

      {/* 2 · Filosofía */}
      <section className="filosofia">
        <img className="canada" src="/img/canada.webp" alt="Made in Canada · Family owned" width={330} height={210} />
        <img className="corazon" src="/img/corazon-mascotas.webp" alt="Un gato y un pug asomados dentro de un corazón rojo" width={896} height={530} />
        <div className="banda">
          <p>
            Priorizamos <span className="rojo">la salud</span> por encima de todo, algo que se refleja en cada
            croqueta que elaboramos y en cada ingrediente que elegimos. <em>Queremos lo mejor para tu mejor
            amigo</em>, para que tenga una vida larga y saludable.
          </p>
          <p>
            <strong className="rojo">Nuestro objetivo</strong> no solo es promover la salud física de tu mascota,
            sino también su nutrición y bienestar general, ya que una mascota bien alimentada tendrá la energía
            para jugar contigo y brindarte alegría, amor y felicidad.
          </p>
        </div>
        <img className="productos" src="/img/productos-1stchoice.webp" alt="Línea de alimentos 1st Choice para perros y gatos" width={1200} height={475} />
      </section>

      {/* 3 · Pronature */}
      <section className="pronature">
        <img src="/img/pronature-hero.webp" alt="Pronature: Nutre el amor, inspirado en la naturaleza" width={1080} height={1422} />
        <img className="nutricion" src="/img/nutricion-completa.webp" alt="Nutrición completa para todas las etapas" width={1000} height={138} />
      </section>

      {/* 4 · Registro */}
      <section className="registro" id="registro">
        <h2>¡REGÍSTRATE Y GANA!</h2>
        <p className="registro-sub">Completa tus datos y los de tu mascota para participar en el sorteo.</p>
        <RegistroForm />
        <div className="marcas">
          <img src="/img/logo-1stchoice.webp" alt="1st Choice" width={120} height={116} />
          <img className="pn" src="/img/pronature-logo.webp" alt="Pronature" width={139} height={45} />
        </div>
      </section>

      <img className="cierre" src="/img/perro-gato.webp" alt="Un perro y un gato durmiendo juntos" width={1080} height={806} />
      <footer className="pie">1st Choice · Pronature — Nutrición hecha en Canadá</footer>
    </main>
  );
}
