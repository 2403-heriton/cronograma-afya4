
import React from 'react';

// Logo da Afya em Data URL (Versão corrigida e completa)
export const afyaLogoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAyCAYAAAAZUZThAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB6SURBVHgB7c6xCQAgDAVRR9D9B7YQU7gEaztBwCE5/wj4ZmbOtt/jOAQIEKQIECBIECBAkCBAgCBBgABBggABggQBAgQJAgQIEgQIECQIECBIECBAkCBAgCBBgABBggABggQBAgQJAgQIEgQIECQIECBIECBAkCBAgMAzswFqTwIEW61JjQAAAABJRU5ErkJggg=='; 

// Nota: A string acima é um placeholder. Para a logo real, recomenda-se converter o arquivo PNG/SVG oficial para Base64.
// Abaixo, utilizamos a URL da imagem para o componente visual na tela, e o DataURL para o PDF (pois html2canvas lida melhor com base64 inline).

const AfyaLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
   <img 
    src="https://d9hhrg4mnvzow.cloudfront.net/institucional.afya.com.br/marca-e-cultura/1626d798-afya-faculdade-de-ciencias-medicas-branca-2_10ky04y0c004y000000000.png" 
    alt="Afya Logo" 
    className={props.className} 
    style={props.style} 
   />
);

export default AfyaLogo;
