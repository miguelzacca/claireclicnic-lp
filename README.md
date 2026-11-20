# Clairé Clinic

Landing page em HTML, CSS e JavaScript. A direção de arte usa marfim, vinho, vidro canelado e fotografia editorial.

## Prévia

Na pasta do projeto, execute `python -m http.server 4173 --bind 127.0.0.1` e abra [a página interativa](http://127.0.0.1:4173/).

- O clipe registra a abertura, a escolha de nutrição e a passagem pela equipe e pelo contato. [Ver gravação](http://127.0.0.1:4173/cena.html).
- A prancha reúne os quadros do navegador em desktop e celular. [Ver os marcos da cena](evidencias/quadros-claire.jpg).

## Contrato da cena

Ao avançar, o visitante vê o retrato dar lugar a dois painéis que abrem a partir do centro. Os painéis passam a mostrar exemplos de atendimento e funcionam como atalhos para a ficha selecionada.

| Marco | Composição e ação |
| --- | --- |
| 0% | Título e agendamento em marfim. O arco enquadra o retrato e o vidro atravessa a borda da fotografia. |
| 35% | O retrato avança e gira. O vidro cruza o quadro e as duas placas começam a abrir pelo centro, com fundo vinho. |
| 70% | Os painéis assentam e apresentam estética facial e nutrição clínica, com exemplos de atendimento e links para as fichas reais. |
| 100% | Os dois painéis continuam acionáveis. Uma curva marfim sobe pela base e entrega a cena à seção de especialidades. |
| Chegada | As abas mostram uma especialidade por vez. Cada ficha apresenta a profissional, os atendimentos e seu próprio texto de abertura no WhatsApp. |

O palco usa rolagem nativa e `position: sticky`. A posição da página controla a câmera, a passagem do vidro, o ângulo dos painéis e a saída. Em telas estreitas, os painéis abrem na vertical. A versão com movimento reduzido usa o retrato e leva diretamente às especialidades. As duas fichas são legíveis em fluxo com JavaScript desativado.

O contrato de teste contém os seletores e os pontos da sequência para o verificador da skill. [contrato-cena.json](contrato-cena.json).

## Edição

- [index.html](index.html) contém os textos, os dois caminhos de atendimento e os links comerciais.
- [styles.css](styles.css) define a tipografia, as fichas, a equipe e o contato.
- [cinema.css](cinema.css) define o palco e os enquadramentos.
- [film.js](film.js) contém os limites dos movimentos, o avanço e a reversão da dobra.
- [script.js](script.js) liga a cena às abas e mantém os atalhos do menu.

A prévia usa `noindex`. Em uma publicação, configure a URL canônica e a URL absoluta do cartão social para o domínio adotado.

## Fontes e imagens

- A unidade, o endereço e o telefone foram conferidos na [ficha do Google Maps](https://www.google.com/maps?cid=6485347199191320913).
- O agendamento leva ao [WhatsApp comercial da Clairé Clinic](https://wa.me/5547933883550).
- Os atendimentos e as profissionais estão documentados na [cobertura da inauguração](https://www.vipsocial.com.br/noticia/claire-clinic-inaugura-em-itapema-com-proposta-integrada-de-estetica-facial-e-nutricao-saiba-detalhes/59066) e no [cadastro empresarial](https://www.empresasdobrasil.com.br/empresa/66854247000183-claire-clinic-ltda).
- Perfil oficial informado no pedido. [Instagram da Clairé Clinic](https://www.instagram.com/claireclinic_/).
- Licenças acompanhadas no projeto. [DM Sans](assets/fonts/OFL-DM-Sans.txt) e [Instrument Serif](assets/fonts/OFL-Instrument-Serif.txt).

ImageGen produziu o retrato de campanha, o recorte de vidro, as fotos conceituais da pele e da mesa e o prisma da seção de equipe. As imagens do site são ilustrativas. [Ativos WebP e cartão social](assets/images).

As pranchas locais de Fermento e Torra foram estudadas para ligar gesto, pausa e escolha à sequência. A geometria da dobra, a fotografia e a composição foram criadas para a Clairé.

<details>
<summary>Prompts de geração</summary>

### Retrato de campanha

```text
Fine art beauty editorial portrait for a contemporary Brazilian facial aesthetics and clinical nutrition brand. Single portrait-oriented fashion photograph, 4:5 or 2:3. An anonymous adult Brazilian woman in her early thirties with natural golden olive-brown skin, real pores, small imperfections, rich dark-brown hair loosely swept into a neat low bun, in three-quarter profile looking calmly to the left with eyes slightly raised, poised and warm. Cream draped high-neck garment with a sculptural fold, understated. Compose her bust centered at x=55%, eyes around 32% from top; keep head intact with 10% air above and face in center-left of photo, ensure face remains visible in a center vertical crop. Quiet luxury photography on warm stone and deep muted aubergine rose, soft daylight crossing a piece of ribbed rosy glass out of focus at the far right, long elegant gradients and optional very subtle optical light bands near shoulders. Strong controlled film lighting, true photographic lens 85 mm, organic skin texture, contemporary fine-art publication aesthetic, slightly dark editorial palette but clear eyes, ivory/champagne and raisin/wine. A single clean focal area. No typography, no quotes, no logos, no watermark, no borders, no symbols, no clinical instruments, no other people. This is a conceptual image, not a real clinic patient or employee.
```

### Vidro canelado

```text
A single exquisite sculptural loop of thick ribbed champagne-rose cast glass, isolated product cutout on a genuinely transparent background with alpha, portrait orientation, whole object visible and centered with tidy margins. One continuous luminous strip makes a graceful asymmetric vertical S curve, the upper loop turns back in space, and the lower tail extends into a slender swoop. Substantial curved volume, fine parallel flutes on the surface, warm rose-gold edge reflections and restrained pale champagne highlights, clear optical glass with translucent lighter regions, refined collectible design object. It evokes a curved glass lens opening, not a logo or an infinity symbol. Ultra-realistic studio photography, subtle dark wine on the inner folds, directional soft light from upper left, nothing else in frame. Smooth complete silhouette, no background color, no checkerboard, no cast floor shadows, no pedestal, no texture outside object, no words, no UI, no logo, no watermark.
```

### Estética facial

```text
Create one cinematic 3:2 horizontal editorial beauty photo for a Brazilian aesthetics studio, concept image without any clinical treatment. Very close three-quarter profile of an anonymous adult woman in her thirties with warm brown skin, lips and cheek lit from left, genuine skin pores and fine beauty marks, dark hair swept away, fingertips gently resting under jaw with natural short nails. Focal point: cheek and hand near center-right, generous dark raisin space on left and bottom for optional composition, lens at cheek level, beautiful honest natural texture. Art direction: high-fashion editorial like a fine art print, soft aubergine shadow, pale blush champagne light and warm cream fabric, background warm taupe with light filtering through glass. A single original photograph. No writing, no borders, no harsh retouching, no makeup product, no PPE, no procedure, no clinic location, no logo.
```

### Nutrição clínica

```text
Create one 3:2 horizontal editorial still life photograph to introduce the nutrition specialty of a sophisticated Brazilian clinic. On pale textured travertine, a sculptural cream ceramic plate with a split red pomegranate, a few dark plums, loose seeds and a minimal folded natural oat linen napkin. Photo from a slightly elevated oblique angle, strong subject within central 60 percent for a vertical crop, room around fruit. Soft directional daylight through a curved amber glass panel just outside view yields a delicate pattern of parallel light and aqueous caustic shadows. Deep burgundy fruit with ecru stone and a few light warm amber highlights, tactile and real, quiet contemporary fine art still life. No other decorations, no raw meat, no printed paper, no labels, no text, no frame or watermark, no people.
```

### Vidro da seção de equipe

```text
A single fine-art photographic still life for a Brazilian clinic editorial site. Vertical 4:5 photo. Monumental close crop of two large thick translucent smoky rose and wine cast-glass slabs with vertically ribbed texture and rounded curved shoulders, standing on a warm pale limestone base. An angled shaft of champagne sunlight enters from upper left, refracting into a vivid striped warm reflection across the lower right. Colors blackberry burgundy, cocoa-rose, wine-black in the shadows and luminous amber highlights. Abstract in framing, recognizably fine optical glass, tactile film grain, beautiful shadow, modern editorial design and sculpture. Keep the glowing decisive fold slightly right of center and leave some peripheral darkness. No recognizable building, people, logo, written text, captions or border. Single photographic exposure and no background graphics.
```

</details>
