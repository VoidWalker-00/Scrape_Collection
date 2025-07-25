// interface.rs
use std::io;

use crossterm::event::{self, Event, KeyCode, KeyEvent, KeyEventKind};
use ratatui::{
    buffer::Buffer, layout::Rect, prelude::*, style::Stylize, symbols::border, text::{Line, Text}, widgets::{Block, Paragraph, Table, Widget}, DefaultTerminal, Frame
};
use color_eyre::{
    eyre::{bail, WrapErr},
    Result,
};

#[derive(Debug, Default)]
pub struct App {
    pub exit: bool,
    title: String,
    url: String,
}

impl App {

    /// runs the application's main loop until the user quits
    pub fn run(&mut self, terminal: &mut DefaultTerminal) -> Result<()> {
        self.title = String::from("ToolBox - Table Extraction");
        self.url= String::from("https://www.worldometers.info/world-population/population-by-country/");

        while !self.exit {
            terminal.draw(|frame| self.draw(frame))?;
            self.handle_events().wrap_err("Handle events failed!")?;
        }
        Ok(())
    }

    pub fn title_block(&self, area: Rect, buf: &mut Buffer) -> (){
        let title = Line::from(format!(" {} | Version 0.0.1 ", &self.title).bold());
        let block = Block::bordered()
            .title_top(title.centered())
            .border_set(border::THICK);

        let text: Vec<Line> = vec![
            Line::from(format!("URL: {}", &self.url).yellow()),
        ];

        Paragraph::new(text)
            .centered()
            .block(block)
            .render(area, buf);

    }

    pub fn table_block(&self, area: Rect, buf: &mut Buffer, row: Vec<Vec<String>>) -> (){
        let block = Block::bordered()
            .border_set(border::THICK);

        Table::new() 
    }

    pub fn layout(&self, area: Rect) -> Vec<Rect> {
        Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Percentage(10),
                Constraint::Percentage(60),
                Constraint::Percentage(30),
            ])
            .split(area).to_vec()
    }

    pub fn draw(&self, frame: &mut Frame) {
        let layout = self.layout(frame.area());
        frame.render_widget(self, layout[0]);
    }

    pub fn exit(&mut self) {
        self.exit = true;
    }

    pub fn handle_key_event(&mut self, key_event: KeyEvent) {
        match key_event.code {
            KeyCode::Char('q') => self.exit(),
            _ => {}
        }
    }

    pub fn handle_events(&mut self) -> Result<()> {
        match event::read()? {
            // it's important to check that the event is a key press event as
            // crossterm also emits key release and repeat events on Windows.
            Event::Key(key_event) if key_event.kind == KeyEventKind::Press => {
                self.handle_key_event(key_event)
            }
            _ => {}
        };
        Ok(())
    }
}

impl Widget for &App {
    fn render(self, area: Rect, buf: &mut Buffer) {
        self.title_block(area, buf);
    }
}
