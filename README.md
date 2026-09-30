# RPG VTT System

Uma plataforma virtual de mesa (VTT) desenvolvida para jogar RPG online,
permitindo criar fichas, salas e interagir com outros jogadores em tempo real.

## 🎲 Sobre o projeto

O RPG VTT System foi desenvolvido em React com Appwrite como backend,
banco de dados e serviço de comunicação em tempo real.

A aplicação permite que os usuários criem e gerenciem suas fichas,
criem salas de RPG e convidem outros jogadores através de um código.

Dentro de uma sala, diversas ações são sincronizadas em tempo real entre
os participantes, permitindo que a sessão continue de onde parou mesmo
depois que os usuários saem e retornam à sala.

## ✨ Funcionalidades

### 👤 Usuários
- Cadastro e autenticação de usuários
- Criação e gerenciamento de fichas
- Salvamento de fichas
- Exportação da ficha como imagem

### 🏠 Salas
- Criação de salas
- Entrada em salas através de código
- Salas associadas ao usuário para facilitar o retorno
- Possibilidade de sair de uma sala
- Dados da sala persistidos para continuar a sessão posteriormente

### 🗺️ Mesa virtual
- Adição de mapas
- Adição de tokens
- Movimentação de tokens em tempo real
- Exibição de elementos para os jogadores
- Rotação de dados
- Rolagem de dados
- Chat em tempo real

### ⚡ Comunicação em tempo real

As ações realizadas dentro da sala são sincronizadas entre os usuários
através do sistema de realtime do Appwrite.

Entre as ações sincronizadas estão:

- Adição de tokens
- Movimentação de tokens
- Adição de mapas
- Exibição de elementos
- Rolagem de dados
- Chat
- Alterações realizadas durante a sessão

Isso permite que diferentes jogadores visualizem as ações uns dos outros
sem precisar atualizar a página.

## 🛠️ Tecnologias

- React
- JavaScript
- Appwrite
- Appwrite Database
- Appwrite Realtime

## 🔄 Funcionamento

O fluxo principal da aplicação funciona da seguinte forma:

1. O usuário cria uma conta ou realiza login.
2. O usuário pode criar uma ficha.
3. O usuário pode criar uma nova sala ou entrar em uma sala através de um código.
4. Dentro da sala, os participantes podem configurar o mapa e adicionar tokens.
5. As ações realizadas na sala são sincronizadas em tempo real.
6. Os dados da sala permanecem salvos para que os participantes possam
   continuar a sessão posteriormente.

## ⚠️ Limitações atuais

O sistema de permissões das salas ainda está em desenvolvimento.

Atualmente não existe uma separação entre o criador da sala e os demais
jogadores. Dessa forma, qualquer participante da sala possui permissões
que podem permitir alterações ou exclusão de elementos da sala.

A autenticação está implementada, porém o sistema ainda não passou por
uma etapa específica de testes e auditoria de segurança.

## 📚 Objetivo do projeto

O projeto foi desenvolvido como uma aplicação prática para estudar e
aplicar conceitos de desenvolvimento web, React, persistência de dados,
autenticação e comunicação em tempo real.

Além disso, o projeto busca fornecer uma ferramenta para facilitar sessões
de RPG de mesa realizadas de forma online.
