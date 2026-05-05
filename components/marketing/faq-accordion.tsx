"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "A proposta que recebo é firme?",
    answer:
      "A proposta é baseada nos dados que nos forneceste e tem validade de 48 horas. É firme — desde que o estado do veículo na inspeção corresponda ao que descreveste. Se a inspeção revelar diferenças significativas (danos não declarados, saúde da bateria muito inferior, etc.), ajustamos o valor antes de fecharmos o negócio. O que não fazemos é renegociar à última hora sem razão: se o carro está como disseste, o valor não muda.",
  },
  {
    question: "Quanto tempo demora todo o processo?",
    answer:
      "Preencher o formulário demora menos de 1 minuto. A nossa avaliação e proposta chegam-te por SMS em menos de 1 hora. A inspeção presencial tem uma duração semelhante — a avaliação da saúde da bateria requer algum tempo mas é feita no próprio dia. O pagamento é processado nas 24 horas seguintes à inspeção.",
  },
  {
    question: "Onde ficam? Tenho de levar o carro?",
    answer:
      "Estamos na zona da Trofa, Porto. Não precisas de te deslocar — fazemos nós a recolha do veículo em morada à tua escolha, seja em casa, no trabalho ou noutro local conveniente.",
  },
  {
    question: "Quem são vocês?",
    answer:
      "Somos uma equipa especializada exclusivamente em veículos elétricos usados. Trabalhamos com compradores e frotas em Portugal e Europa. O foco total em elétricos permite-nos oferecer avaliações muito mais precisas do que um revendedor generalista.",
  },
  {
    question: "Como avaliam a saúde da bateria?",
    answer:
      "Usamos dados do próprio veículo (SoH — State of Health) combinados com bases de dados de degradação por modelo, quilometragem e historial de carregamentos. Não adivinhamos — calculamos. É isso que nos permite fazer propostas firmes sem ver o carro pessoalmente.",
  },
];

export function FaqAccordion() {
  return (
    <Accordion className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-base font-medium text-left py-4 hover:no-underline hover:text-primary transition-colors">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
