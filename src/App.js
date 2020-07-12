import React, { useState, useEffect } from 'react';
import { Button, Layout, Row, Typography, Space } from 'antd';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { apiGetAccountAssets } from './utils/api';

const { Header, Footer, Sider, Content } = Layout;
const { Text, Link } = Typography;
const UPDATE_TIME = 5000;

const initWaletState = {
  connected: false,
  chainId: '',
  accounts: [],
  address: '',
  balanceEth: 0,
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
      let timerId = setTimeout(async function tick() {
        const result = await apiGetAccountAssets(
          walletState.address,
          walletState.chainId
        );
        console.log(result);
        timerId = setTimeout(tick, UPDATE_TIME); // (*)
      }, UPDATE_TIME);

      apiGetAccountAssets(walletState.address, walletState.chainId).then(
        (res) => {
          let ethBal = parseInt(res, 16);
          ethBal = ethBal * Math.pow(10, -18);
          console.log('Eth balance = ' + ethBal);
          handleWalletState({
            ...walletState,
            balanceEth: ethBal,
          });
        }
      );
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
          <Button type="primary" onClick={() => createSessionWallet()}>
            Create session
          </Button>
        )}
        {walletState.balanceEth && (
          <Text strong style={{ color: '#000' }}>
            {`Balance ETH: ${walletState.balanceEth}`}
          </Text>
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
