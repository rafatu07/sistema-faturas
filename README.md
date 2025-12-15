# Sistema de Controle de Faturas e Dotação Orçamentária

Sistema web moderno para controle de faturas (energia elétrica, água e telefonia) e dotação orçamentária, desenvolvido com Next.js, Firebase e OCR.

## 🚀 Tecnologias

- **Next.js 16** (App Router) com TypeScript
- **Firebase** (Authentication, Firestore, Storage)
- **Tesseract.js** para OCR
- **shadcn/ui** para componentes de UI
- **Tailwind CSS** para estilização

## 📋 Funcionalidades

- ✅ Autenticação por email/senha com sistema de roles (admin/user)
- ✅ Cadastro e gestão de empenhos orçamentários
- ✅ Cadastro de faturas com OCR automático
- ✅ Vinculação de empenhos a faturas
- ✅ Relatórios por vencimento e conta bancária
- ✅ Dashboard com métricas e alertas

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd sistema-faturas
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative os serviços:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
3. Copie as credenciais do Firebase e crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Configure as Security Rules

#### Firestore Rules

No Firebase Console, vá em Firestore Database > Rules e cole o conteúdo do arquivo `firestore.rules`.

#### Storage Rules

No Firebase Console, vá em Storage > Rules e cole o conteúdo do arquivo `storage.rules`.

### 5. Execute o projeto

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
sistema-faturas/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Rotas protegidas
│   └── layout.tsx         # Layout raiz
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   ├── auth/             # Componentes de autenticação
│   ├── empenhos/         # Componentes de empenhos
│   ├── faturas/          # Componentes de faturas
│   ├── relatorios/       # Componentes de relatórios
│   └── dashboard/        # Componentes do dashboard
├── lib/                  # Utilitários e serviços
│   ├── firebase/         # Configuração Firebase
│   ├── services/         # Serviços de negócio
│   ├── ocr/              # Serviço de OCR
│   ├── hooks/            # Custom hooks
│   └── utils/            # Funções utilitárias
└── types/                # TypeScript types
```

## 🔐 Sistema de Autenticação

O sistema possui dois tipos de usuários:

- **Admin**: Pode ver todos os dados do sistema
- **User**: Vê apenas seus próprios dados

Para criar um usuário admin, você precisa:

1. Criar o usuário via Firebase Authentication
2. Criar o documento na collection `users` com `role: 'admin'`

## 📊 Modelagem de Dados

### Collections do Firestore

- **users**: Dados dos usuários
- **empenhos**: Empenhos orçamentários
- **faturas**: Faturas cadastradas
- **faturaEmpenhos**: Vinculações entre faturas e empenhos

## 🔍 OCR (Reconhecimento Óptico de Caracteres)

O sistema utiliza Tesseract.js para extrair automaticamente:

- Tipo de fatura (EDP, SABESP, Telefonia)
- Valor total
- Data de vencimento

O usuário pode revisar e ajustar os dados extraídos antes de salvar.

## 📝 Uso

### Cadastrar Empenho

1. Acesse **Empenhos** no menu
2. Clique em **Novo Empenho**
3. Preencha os dados (número, dotação, conta bancária, valores)
4. O saldo será atualizado automaticamente conforme o uso

### Cadastrar Fatura

1. Acesse **Faturas** no menu
2. Clique em **Upload com OCR** ou **Nova Fatura**
3. Se usar OCR, faça upload da imagem/PDF
4. Revise os dados extraídos
5. Salve a fatura

### Vincular Empenho a Fatura

1. Acesse uma fatura específica
2. Na seção **Vinculação de Empenhos**
3. Selecione um empenho disponível
4. Informe o valor a ser utilizado
5. O sistema valida o saldo e atualiza automaticamente

### Gerar Relatórios

1. Acesse **Relatórios** no menu
2. Visualize os dados agrupados por:
   - Vencimento
   - Conta bancária

## 🚧 Próximas Funcionalidades

- [ ] Exportação em PDF/CSV
- [ ] Notificações de faturas próximas ao vencimento
- [ ] Gráficos mais elaborados no dashboard
- [ ] Histórico detalhado de alterações
- [ ] Integração com APIs externas de OCR

## 📄 Licença

Este projeto é de uso interno.

## 🤝 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
