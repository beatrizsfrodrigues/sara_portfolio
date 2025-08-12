import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Text,
  Button,
  Card,
  Image,
  Skeleton,
  Box,
  Flex,
} from "@chakra-ui/react";
import { FaInstagram } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { FiPhone } from "react-icons/fi";

export default function About() {
  return (
    <div className="bodyDiv">
      {/* <h1>Sara Ferreira</h1> */}
      <Flex id="about" gap="16">
        <Image
          maxWidth="380px"
          src="/photos/sara-ferreira.jpeg"
          alt="Sara Ferreira"
          borderRadius="8px"
          id="about-image"
          marginBottom="0px"
        />
        <div>
          <h3>Sara Ferreira</h3>
          <p>
            Natural do Porto, Portugal, Sara Ferreira é uma fotógrafa cuja
            ligação com a imagem nasceu muito antes de se tornar profissão.
            Desde cedo, encantou-se pela forma como a luz, as cores e os
            detalhes desenham momentos que os olhos apenas conseguem apanhar
            durante um instante, mas que a câmara pode eternizar. Em 2019,
            decidiu dar um passo mais sério, iniciando um percurso profissional
            que alia técnica, sensibilidade e um olhar profundamente pessoal.{" "}
            <br /> <br /> A edição surge como extensão natural da sua visão
            criativa, permitindo-lhe moldar a atmosfera para transmitir a emoção
            exata de cada história captada.
            <br /> <br /> Paralelamente, a dança acompanha o seu percurso,
            enriquecendo a sua visão estética e sensibilidade ao movimento.
            Frequenta o programa Vocational da RAD e aulas de técnica Vaganova,
            o que contribui para uma perceção única de ritmo, expressão e
            composição — elementos que também se refletem no seu trabalho
            fotográfico.
            <br /> <br /> Embora a sua especialização fotográfica seja a dança,
            também realiza trabalhos em todo o tipo de eventos, retratos
            individuais, sessões de casal e sessões que retratam laços de
            amizade, possuindo experiência consolidada em todas estas áreas.
          </p>
          <br />
          <h3>Contactos</h3>
          <a href="tel:+351915370827" target="_blank" rel="noopener noreferrer">
            <p className="contact">
              <FiPhone /> +351 915 370 827
            </p>
          </a>
          <a
            href="mailto:ssaras.photos@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <p className="contact">
              <MdOutlineEmail /> ssaras.photos@gmail.com
            </p>
          </a>
          <a
            href="https://www.instagram.com/saras._.photos?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
          >
            <p className="contact">
              <FaInstagram /> @saras._.photos
            </p>
          </a>
        </div>
      </Flex>
    </div>
  );
}
