import React, { useState, useEffect } from 'react';
import { Button, Layout, Row, Typography, Space } from 'antd';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { apiGetAccountAssets } from './utils/api';

const { Header, Footer, Sider, Content } = Layout;
const { Text, Link } = Typography;

const initWaletState = {
  connected: false,
  chainId: '',
  accounts: [],
  address: '',
};

export default function App() {
  const [walletState, handleWalletState] = useState(initWaletState);
  const [connector, setConnector] = useState(
    new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      qrcodeModal: QRCodeModal,
    })
  );

  const createSessionWallet = async () => {
    console.log(connector);

    if (!connector.connected) {
      await connector.createSession();
    } else {
      handleWalletState({
        ...walletState,
        connected: true,
        chainId: connector.chainId,
        accounts: connector.accounts,
        address: connector.accounts[0],
      });
    }

    setEvents();
  };

  const setEvents = () => {
    // Subscribe to connection events
    connector.on('connect', (error, payload) => {
      console.log(payload);
      if (error) {
        throw error;
      }
      connectOn(payload.params[0]);
    });

    connector.on('session_update', (error, payload) => {
      if (error) {
        throw error;
      }

      // Get updated accounts and chainId
      const { accounts, chainId } = payload.params[0];
      console.log(accounts);
      console.log(chainId);
    });

    connector.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }
      console.log(payload);
      handleWalletState(initWaletState);
    });
  };

  const connectOn = (params) => {
    console.log(walletState);
    const { accounts, chainId } = params;
    handleWalletState({
      ...walletState,
      connected: true,
      chainId,
      accounts,
      address: accounts[0],
    });
  };

  useEffect(() => {
    if (walletState.address && walletState.chainId) {
      apiGetAccountAssets(
        walletState.address,
        walletState.chainId
      ).then((res) => console.log(res));
    }
  }, [walletState.address, walletState.chainId]);

  console.log(walletState);
  return (
    <Layout>
      <Header>
        <Space>
          <Text strong style={{ color: '#fff' }}>{`${
            walletState.connected ? 'On' : 'Off'
          }line`}</Text>

          {walletState.address && (
            <Text strong style={{ color: '#fff' }}>
              {walletState.address}
            </Text>
          )}
        </Space>
      </Header>
      <Content>
        {!walletState.connected && (
          <Button type='primary' onClick={() => createSessionWallet()}>
            Create session
          </Button>
        )}
      </Content>
      <Footer>
        Footer
        {connector && walletState.connected && (
          <Button onClick={() => connector.killSession()}>disconnect</Button>
        )}
      </Footer>
    </Layout>
  );
}
