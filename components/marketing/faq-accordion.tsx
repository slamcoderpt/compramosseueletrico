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
      "Sim. Quando te enviamos uma proposta por SMS, ela é válida por 48 horas e não muda. Não há negociação à última hora nem surpresas na entrega. O valor que vês é o que recebes.",
  },
  {
    question: "Quanto tempo demora todo o processo?",
    answer:
      "A avaliação demora menos de 1 minuto. Após receberes a proposta, podes aceitar de imediato. O pagamento é processado nas 24 horas seguintes à verificação do veículo. Na prática, a maioria dos vendedores conclui tudo em menos de dois dias.",
  },
  {
    question: "Onde ficam? Tenho de levar o carro?",
    answer:
      "Não precisas de se deslocar. Fazemos nós a recolha do veículo em morada à tua escolha — seja em casa, no trabalho ou noutro local conveniente. Cobrimos todo o território continental.",
  },
  {
    question: "E se mudar de ideias depois de aceitar?",
    answer:
      "Tens 24 horas após aceitar a proposta para recusar sem qualquer custo ou penalização. A partir do momento em que a recolha é agendada e confirmada, o negócio considera-se feito.",
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
